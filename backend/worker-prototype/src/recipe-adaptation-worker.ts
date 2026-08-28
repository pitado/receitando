import { adaptRecipe, type AdaptableIngredient } from "./lib/recipe-adaptation";
import {
  apiError,
  corsHeaders,
  type Env,
  json,
  readJson,
} from "./lib/worker-http";

type RecipeAdaptationRow = {
  id: string;
  title: string;
  servings: number;
};

type RecipeIngredientRow = AdaptableIngredient & {
  optional: number;
  isStaple: number;
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

async function adaptRecipeBySlug(request: Request, env: Env, slug: string): Promise<Response> {
  const recipe = await env.db
    .prepare("SELECT id, title, servings FROM recipes WHERE slug = ? LIMIT 1")
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

  const unavailableIngredients = Array.isArray(body?.unavailableIngredients)
    ? body.unavailableIngredients
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 80)
    : [];

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

  const result = adaptRecipe({
    recipeTitle: recipe.title,
    currentServings: Number(recipe.servings) || 0,
    targetServings,
    unavailableIngredients,
    ingredients: ingredientRows.results.map((ingredient) => ({
      ...ingredient,
      optional: Boolean(ingredient.optional),
      isStaple: Boolean(ingredient.isStaple),
    })),
  });

  return json(request, env, result);
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
