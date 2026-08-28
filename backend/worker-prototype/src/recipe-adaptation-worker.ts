import { adaptRecipe, type AdaptableIngredient } from "./lib/recipe-adaptation";
import { contextualizeAdaptation, inferRecipeContext } from "./lib/recipe-context";
import { compareKitchenAmounts, formatBaseKitchenAmount } from "./lib/kitchen-units";
import {
  apiError,
  authenticatedUserId,
  corsHeaders,
  type Env,
  json,
  readJson,
} from "./lib/worker-http";

type RecipeAdaptationRow = {
  id: string;
  title: string;
  servings: number;
  mealType: string | null;
  instructions: string | null;
};

type RecipeIngredientRow = Omit<AdaptableIngredient, "optional" | "isStaple"> & {
  optional: number;
  isStaple: number;
};

type PantryRow = {
  ingredientId: string;
  quantity: number | null;
  unit: string | null;
};

function normalizedPath(request: Request): string {
  return new URL(request.url).pathname.replace(/\/+$/, "") || "/";
}

function recipeSlugFromPath(path: string): string | null {
  const match = path.match(/^\/api\/recipes\/([^/]+)\/adapt$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function validTargetServings(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 50) return undefined;
  return numeric;
}

async function pantryForUser(env: Env, userId: string): Promise<PantryRow[]> {
  const rows = await env.db.prepare(`
    SELECT ingredient_id AS ingredientId, quantity, unit
    FROM pantry_items
    WHERE user_id = ?
  `).bind(userId).all<PantryRow>();
  return rows.results;
}

async function adaptRecipeBySlug(request: Request, env: Env, slug: string): Promise<Response> {
  const recipe = await env.db
    .prepare(`
      SELECT
        id,
        title,
        servings,
        meal_type AS mealType,
        instructions
      FROM recipes
      WHERE slug = ?
      LIMIT 1
    `)
    .bind(slug)
    .first<RecipeAdaptationRow>();

  if (!recipe) return apiError(request, env, 404, "Receita não encontrada.");

  const body = await readJson(request);
  const targetProvided = body?.targetServings !== undefined && body?.targetServings !== null && body?.targetServings !== "";
  const targetServings = validTargetServings(body?.targetServings);
  if (targetProvided && targetServings === undefined) {
    return apiError(request, env, 400, "targetServings deve ser um inteiro entre 1 e 50.");
  }

  if (body?.unavailableIngredients !== undefined && !Array.isArray(body.unavailableIngredients)) {
    return apiError(request, env, 400, "unavailableIngredients deve ser uma lista.");
  }
  if (body?.usePantry !== undefined && typeof body.usePantry !== "boolean") {
    return apiError(request, env, 400, "usePantry deve ser verdadeiro ou falso.");
  }

  const manualUnavailable = Array.isArray(body?.unavailableIngredients)
    ? body.unavailableIngredients
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 80)
    : [];
  const usePantry = body?.usePantry === true;

  const ingredientRows = await env.db.prepare(`
    SELECT
      i.id AS ingredientId,
      i.name,
      i.normalized_name AS normalizedName,
      i.category,
      ri.quantity,
      ri.unit,
      ri.optional,
      i.is_staple AS isStaple,
      ri.raw_text AS rawText
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
    WHERE ri.recipe_id = ?
    ORDER BY ri.optional, i.is_staple, i.name
  `).bind(recipe.id).all<RecipeIngredientRow>();

  const tagRows = await env.db.prepare(`
    SELECT tag
    FROM recipe_tags
    WHERE recipe_id = ?
    ORDER BY tag
  `).bind(recipe.id).all<{ tag: string }>();

  const ingredients = ingredientRows.results.map((ingredient) => ({
    ...ingredient,
    optional: Boolean(ingredient.optional),
    isStaple: Boolean(ingredient.isStaple),
  }));

  let pantryRows: PantryRow[] = [];
  if (usePantry) {
    const userId = await authenticatedUserId(request, env);
    if (!userId) {
      return apiError(request, env, 401, "Entre na sua conta para adaptar usando a despensa.");
    }
    pantryRows = await pantryForUser(env, userId);
  }

  const preliminary = adaptRecipe({
    recipeTitle: recipe.title,
    currentServings: Number(recipe.servings) || 0,
    targetServings,
    unavailableIngredients: manualUnavailable,
    ingredients,
  });

  const pantryByIngredientId = new Map(pantryRows.map((item) => [item.ingredientId, item]));
  const pantryMissingNames: string[] = [];
  const shortages: Array<{
    ingredientId: string;
    ingredientName: string;
    shortage: string | null;
  }> = [];
  let pantryPresentCount = 0;

  if (usePantry) {
    for (const adapted of preliminary.ingredients) {
      const source = ingredients.find((ingredient) => ingredient.ingredientId === adapted.ingredientId);
      if (!source || source.optional || source.isStaple) continue;

      const pantryItem = pantryByIngredientId.get(adapted.ingredientId);
      if (!pantryItem) {
        pantryMissingNames.push(adapted.originalName);
        continue;
      }

      pantryPresentCount += 1;
      const comparison = compareKitchenAmounts(
        adapted.adapted.quantity,
        adapted.adapted.unit,
        pantryItem.quantity,
        pantryItem.unit,
      );
      if (comparison.status === "SHORT") {
        shortages.push({
          ingredientId: adapted.ingredientId,
          ingredientName: adapted.originalName,
          shortage:
            comparison.shortageBase !== null && comparison.dimension
              ? formatBaseKitchenAmount(comparison.shortageBase, comparison.dimension)
              : null,
        });
      }
    }
  }

  const unavailableIngredients = [...new Set([...manualUnavailable, ...pantryMissingNames])];
  const adapted = adaptRecipe({
    recipeTitle: recipe.title,
    currentServings: Number(recipe.servings) || 0,
    targetServings,
    unavailableIngredients,
    ingredients,
  });

  const context = inferRecipeContext({
    title: recipe.title,
    mealType: recipe.mealType,
    instructions: recipe.instructions,
    tags: tagRows.results.map((row) => row.tag),
  });
  const contextual = contextualizeAdaptation(adapted, context);
  const shortageWarnings = shortages.map((item) =>
    item.shortage
      ? `Sua despensa tem ${item.ingredientName}, mas faltam aproximadamente ${item.shortage} para esta adaptação.`
      : `Sua despensa parece ter quantidade insuficiente de ${item.ingredientName}.`,
  );

  return json(request, env, {
    ...contextual,
    warnings: [...new Set([...contextual.warnings, ...shortageWarnings])],
    pantry: {
      used: usePantry,
      presentCount: usePantry ? pantryPresentCount : 0,
      missingCount: usePantry ? pantryMissingNames.length : 0,
      shortageCount: usePantry ? shortages.length : 0,
      missingIngredientIds: usePantry
        ? ingredients
            .filter((ingredient) => pantryMissingNames.includes(ingredient.name))
            .map((ingredient) => ingredient.ingredientId)
        : [],
      shortages: usePantry ? shortages : [],
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = normalizedPath(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    const slug = recipeSlugFromPath(path);
    if (!slug) return apiError(request, env, 404, "Rota não encontrada.");
    if (request.method !== "POST") return apiError(request, env, 405, "Método não permitido.");

    return adaptRecipeBySlug(request, env, slug);
  },
};
