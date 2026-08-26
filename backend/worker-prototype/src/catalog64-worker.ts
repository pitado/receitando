import socialWorker from "./social-worker";
import { compatibilityPercent, matchStatus, normalizeIngredient } from "./lib/recipe-utils";
import {
  apiError,
  authenticatedUserId,
  corsHeaders,
  type Env,
  json,
  readJson,
} from "./lib/worker-http";

type RecipeRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  prepMinutes: number;
  servings: number;
  mealType: string;
  difficulty: "FACIL" | "MEDIA" | "DIFICIL";
  sourceType: "OWN" | "OPEN_DATASET" | "USER";
  sourceName: string;
  sourceUrl: string | null;
  sourceAuthor: string | null;
  sourceLicense: string | null;
  sourceLicenseUrl: string | null;
  sourceLanguage: string | null;
  externalSource: string | null;
  imageUrl: string | null;
  imageSource: string | null;
  imageAuthor: string | null;
  imagePageUrl: string | null;
  imageLicense: string | null;
  imageLicenseUrl: string | null;
  imageAlt: string | null;
};

type IngredientRow = {
  recipeId: string;
  ingredientId: string;
  name: string;
  normalizedName: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  optional: number;
  rawText: string | null;
};

function placeholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(",");
}

async function loadRecipesByIds(env: Env, ids: string[]) {
  if (!ids.length) return [];

  const limited = ids.slice(0, 80);
  const mark = placeholders(limited.length);
  const recipeResult = await env.db.prepare(`
    SELECT id, title, slug, description, instructions,
      prep_minutes AS prepMinutes, servings, meal_type AS mealType, difficulty,
      source_type AS sourceType, source_name AS sourceName,
      source_url AS sourceUrl, source_author AS sourceAuthor,
      source_license AS sourceLicense, source_license_url AS sourceLicenseUrl,
      source_language AS sourceLanguage, external_source AS externalSource,
      image_url AS imageUrl, image_source AS imageSource,
      image_author AS imageAuthor, image_page_url AS imagePageUrl,
      image_license AS imageLicense, image_license_url AS imageLicenseUrl,
      image_alt AS imageAlt
    FROM recipes WHERE id IN (${mark})
  `).bind(...limited).all<RecipeRow>();

  const ingredientResult = await env.db.prepare(`
    SELECT ri.recipe_id AS recipeId, i.id AS ingredientId, i.name,
      i.normalized_name AS normalizedName, i.category,
      ri.quantity, ri.unit, ri.optional, ri.raw_text AS rawText
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
    WHERE ri.recipe_id IN (${mark})
    ORDER BY ri.optional, i.name
  `).bind(...limited).all<IngredientRow>();

  const tagResult = await env.db.prepare(`
    SELECT recipe_id AS recipeId, tag FROM recipe_tags
    WHERE recipe_id IN (${mark}) ORDER BY tag
  `).bind(...limited).all<{ recipeId: string; tag: string }>();

  const ingredientMap = new Map<string, IngredientRow[]>();
  for (const row of ingredientResult.results) {
    const list = ingredientMap.get(row.recipeId) ?? [];
    list.push(row);
    ingredientMap.set(row.recipeId, list);
  }

  const tagMap = new Map<string, string[]>();
  for (const row of tagResult.results) {
    const list = tagMap.get(row.recipeId) ?? [];
    list.push(row.tag);
    tagMap.set(row.recipeId, list);
  }

  const order = new Map(limited.map((id, index) => [id, index]));
  return recipeResult.results.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    instructions: recipe.instructions,
    prepMinutes: recipe.prepMinutes,
    servings: recipe.servings,
    mealType: recipe.mealType,
    difficulty: recipe.difficulty,
    source: {
      type: recipe.sourceType,
      name: recipe.sourceName,
      url: recipe.sourceUrl,
      author: recipe.sourceAuthor,
      license: recipe.sourceLicense,
      licenseUrl: recipe.sourceLicenseUrl,
      language: recipe.sourceLanguage,
      externalSource: recipe.externalSource,
    },
    imageUrl: recipe.imageUrl,
    image: {
      url: recipe.imageUrl,
      source: recipe.imageSource,
      author: recipe.imageAuthor,
      pageUrl: recipe.imagePageUrl,
      license: recipe.imageLicense,
      licenseUrl: recipe.imageLicenseUrl,
      alt: recipe.imageAlt,
    },
    tags: tagMap.get(recipe.id) ?? [],
    ingredients: (ingredientMap.get(recipe.id) ?? []).map((item) => ({
      ingredientId: item.ingredientId,
      name: item.name,
      normalizedName: item.normalizedName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      optional: Boolean(item.optional),
      rawText: item.rawText,
    })),
  })).sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
}

async function listCatalogIngredients(request: Request, env: Env): Promise<Response> {
  const rows = await env.db.prepare(`
    SELECT i.id, i.name, i.normalized_name AS normalizedName, i.category,
      COUNT(DISTINCT ri.recipe_id) AS usageCount
    FROM ingredients i
    JOIN recipe_ingredients ri ON ri.ingredient_id = i.id
    JOIN recipes r ON r.id = ri.recipe_id
    GROUP BY i.id, i.name, i.normalized_name, i.category
    ORDER BY usageCount DESC, i.name ASC
    LIMIT 1200
  `).all<{ id: string; name: string; normalizedName: string; category: string; usageCount: number }>();

  return json(request, env, rows.results);
}

async function listSources(request: Request, env: Env): Promise<Response> {
  const rows = await env.db.prepare(`
    SELECT external_source AS id, source_name AS name, COUNT(*) AS recipeCount
    FROM recipes
    WHERE external_source IS NOT NULL
    GROUP BY external_source, source_name
    ORDER BY source_name
  `).all<{ id: string; name: string; recipeCount: number }>();

  const imported = new Map(rows.results.map((row) => [row.id, Number(row.recipeCount)]));
  return json(request, env, [
    {
      id: "wikibooks",
      name: "Wikilivros",
      homepage: "https://pt.wikibooks.org/wiki/Livro_de_receitas",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      language: "pt-BR",
      recipeCount: imported.get("wikibooks") ?? 0,
    },
  ]);
}

async function canonicalIngredientIds(env: Env, values: string[]): Promise<string[]> {
  const normalized = [...new Set(values.map(normalizeIngredient).filter(Boolean))];
  if (!normalized.length) return [];

  const mark = placeholders(normalized.length);
  const direct = await env.db
    .prepare(`SELECT id FROM ingredients WHERE normalized_name IN (${mark})`)
    .bind(...normalized)
    .all<{ id: string }>();
  const aliases = await env.db
    .prepare(`SELECT ingredient_id AS id FROM ingredient_aliases WHERE normalized_alias IN (${mark})`)
    .bind(...normalized)
    .all<{ id: string }>();

  return [...new Set([...direct.results, ...aliases.results].map((row) => row.id))].slice(0, 80);
}

async function efficientMatch(env: Env, ingredientIds: string[]) {
  if (!ingredientIds.length) return [];

  const mark = placeholders(ingredientIds.length);
  const candidateResult = await env.db.prepare(`
    SELECT ri.recipe_id AS recipeId, COUNT(DISTINCT ri.ingredient_id) AS foundCount
    FROM recipe_ingredients ri
    WHERE ri.optional = 0 AND ri.ingredient_id IN (${mark})
    GROUP BY ri.recipe_id
    ORDER BY foundCount DESC
    LIMIT 80
  `).bind(...ingredientIds).all<{ recipeId: string; foundCount: number }>();

  const recipes = await loadRecipesByIds(env, candidateResult.results.map((row) => row.recipeId));
  const supplied = new Set(ingredientIds);

  return recipes.map((recipe) => {
    const required = recipe.ingredients.filter((item) => !item.optional);
    const found = required.filter((item) => supplied.has(item.ingredientId));
    const missing = required.filter((item) => !supplied.has(item.ingredientId));
    const compatibility = compatibilityPercent(found.length, required.length);

    return {
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      prepMinutes: recipe.prepMinutes,
      servings: recipe.servings,
      mealType: recipe.mealType,
      difficulty: recipe.difficulty,
      imageUrl: recipe.imageUrl,
      image: recipe.image,
      tags: recipe.tags,
      compatibility,
      status: matchStatus(compatibility),
      foundIngredients: found.map((item) => ({ id: item.ingredientId, name: item.name })),
      missingIngredients: missing.map((item) => ({ id: item.ingredientId, name: item.name })),
      optionalIngredients: recipe.ingredients
        .filter((item) => item.optional)
        .map((item) => ({ id: item.ingredientId, name: item.name })),
    };
  }).sort(
    (a, b) =>
      b.compatibility - a.compatibility ||
      a.missingIngredients.length - b.missingIngredients.length ||
      a.prepMinutes - b.prepMinutes ||
      a.title.localeCompare(b.title, "pt-BR"),
  );
}

async function matchFromRequest(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!Array.isArray(body?.ingredients)) {
    return apiError(request, env, 400, "ingredients deve ser uma lista.");
  }

  const values = body.ingredients.filter((item): item is string => typeof item === "string");
  if (values.length < 1 || values.length > 40) {
    return apiError(request, env, 400, "Informe entre 1 e 40 ingredientes.");
  }

  return json(request, env, await efficientMatch(env, await canonicalIngredientIds(env, values)));
}

async function matchFromPantry(request: Request, env: Env): Promise<Response> {
  const userId = await authenticatedUserId(request, env);
  if (!userId) return apiError(request, env, 401, "Entre na sua conta para usar sua despensa.");

  const rows = await env.db
    .prepare("SELECT ingredient_id AS ingredientId FROM pantry_items WHERE user_id = ? LIMIT 80")
    .bind(userId)
    .all<{ ingredientId: string }>();

  return json(request, env, await efficientMatch(env, rows.results.map((row) => row.ingredientId)));
}

async function listRecipes(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit")) || 36));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const search = normalizeIngredient(url.searchParams.get("q") ?? "");
  const source = (url.searchParams.get("source") ?? "").trim().toLowerCase();

  let rows: D1Result<{ id: string }>;
  if (search && source) {
    rows = await env.db
      .prepare("SELECT id FROM recipes WHERE lower(title) LIKE ? AND lower(external_source) = ? ORDER BY title LIMIT ? OFFSET ?")
      .bind(`%${search}%`, source, limit, offset)
      .all<{ id: string }>();
  } else if (search) {
    rows = await env.db
      .prepare("SELECT id FROM recipes WHERE lower(title) LIKE ? ORDER BY title LIMIT ? OFFSET ?")
      .bind(`%${search}%`, limit, offset)
      .all<{ id: string }>();
  } else if (source) {
    rows = await env.db
      .prepare("SELECT id FROM recipes WHERE lower(external_source) = ? ORDER BY updated_at DESC, title LIMIT ? OFFSET ?")
      .bind(source, limit, offset)
      .all<{ id: string }>();
  } else {
    rows = await env.db
      .prepare("SELECT id FROM recipes ORDER BY updated_at DESC, title LIMIT ? OFFSET ?")
      .bind(limit, offset)
      .all<{ id: string }>();
  }

  return json(request, env, await loadRecipesByIds(env, rows.results.map((row) => row.id)));
}

async function recipeBySlug(request: Request, env: Env, slug: string): Promise<Response> {
  const row = await env.db
    .prepare("SELECT id FROM recipes WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<{ id: string }>();

  if (!row) return apiError(request, env, 404, "Receita não encontrada.");
  const recipes = await loadRecipesByIds(env, [row.id]);
  return json(request, env, recipes[0]);
}

async function listFavorites(request: Request, env: Env, userId?: string): Promise<Response> {
  const resolvedUserId = userId ?? await authenticatedUserId(request, env);
  if (!resolvedUserId) {
    return apiError(request, env, 401, "Entre na sua conta para acessar favoritos.");
  }

  const rows = await env.db
    .prepare("SELECT recipe_id AS recipeId FROM favorites WHERE user_id = ? ORDER BY created_at DESC LIMIT 80")
    .bind(resolvedUserId)
    .all<{ recipeId: string }>();

  return json(request, env, await loadRecipesByIds(env, rows.results.map((row) => row.recipeId)));
}

async function addFavorite(request: Request, env: Env): Promise<Response> {
  const userId = await authenticatedUserId(request, env);
  if (!userId) return apiError(request, env, 401, "Entre na sua conta para acessar favoritos.");

  const body = await readJson(request);
  const recipeId = typeof body?.recipeId === "string" ? body.recipeId.trim() : "";
  if (!recipeId) return apiError(request, env, 400, "Informe a receita.");

  const recipe = await env.db
    .prepare("SELECT id FROM recipes WHERE id = ? LIMIT 1")
    .bind(recipeId)
    .first();
  if (!recipe) return apiError(request, env, 404, "Receita não encontrada.");

  await env.db
    .prepare("INSERT OR IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)")
    .bind(userId, recipeId)
    .run();

  return listFavorites(request, env, userId);
}

async function removeFavorite(request: Request, env: Env, recipeId: string): Promise<Response> {
  const userId = await authenticatedUserId(request, env);
  if (!userId) return apiError(request, env, 401, "Entre na sua conta para acessar favoritos.");

  await env.db
    .prepare("DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?")
    .bind(userId, recipeId)
    .run();

  return listFavorites(request, env, userId);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (request.method === "GET" && path === "/api/sources") {
      return listSources(request, env);
    }
    if (request.method === "GET" && path === "/api/ingredients") {
      return listCatalogIngredients(request, env);
    }
    if (request.method === "POST" && path === "/api/recipes/match") {
      return matchFromRequest(request, env);
    }
    if (request.method === "GET" && path === "/api/recipes/match/pantry") {
      return matchFromPantry(request, env);
    }
    if (request.method === "GET" && path === "/api/recipes") {
      return listRecipes(request, env);
    }

    if (path === "/api/favorites" || path.startsWith("/api/favorites/")) {
      if (request.method === "GET" && path === "/api/favorites") {
        return listFavorites(request, env);
      }
      if (request.method === "POST" && path === "/api/favorites") {
        return addFavorite(request, env);
      }
      if (request.method === "DELETE" && path.startsWith("/api/favorites/")) {
        return removeFavorite(
          request,
          env,
          decodeURIComponent(path.slice("/api/favorites/".length)),
        );
      }
      return apiError(request, env, 405, "Método não permitido.");
    }

    const detailMatch = path.match(/^\/api\/recipes\/([^/]+)$/);
    if (request.method === "GET" && detailMatch) {
      return recipeBySlug(request, env, decodeURIComponent(detailMatch[1]));
    }

    return socialWorker.fetch(request, env);
  },
};
