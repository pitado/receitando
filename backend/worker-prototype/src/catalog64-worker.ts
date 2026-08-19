import socialWorker from "./social-worker";

interface Env {
  db: D1Database;
  FRONTEND_URL: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

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
  imageUrl: string | null;
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
};

const encoder = new TextEncoder();

function normalizeIngredient(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

function allowedOrigins(env: Env): string[] {
  return env.FRONTEND_URL.split(",").map((value) => value.trim()).filter(Boolean);
}

function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  });
  const origin = request.headers.get("Origin");
  if (origin && allowedOrigins(env).includes(origin)) headers.set("Access-Control-Allow-Origin", origin);
  return headers;
}

function json(request: Request, env: Env, body: unknown, status = 200): Response {
  const headers = corsHeaders(request, env);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}

function apiError(request: Request, env: Env, status: number, message: string): Response {
  return json(request, env, { statusCode: status, message }, status);
}

function bearerToken(request: Request): string | undefined {
  const value = request.headers.get("Authorization");
  return value?.startsWith("Bearer ") ? value.slice(7).trim() || undefined : undefined;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function authenticatedUserId(request: Request, env: Env): Promise<string | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const row = await env.db.prepare(`
    SELECT s.user_id AS userId
    FROM sessions s
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `).bind(await sha256(token), new Date().toISOString()).first<{ userId: string }>();
  return row?.userId ?? null;
}

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
      source_type AS sourceType, source_name AS sourceName, image_url AS imageUrl
    FROM recipes WHERE id IN (${mark})
  `).bind(...limited).all<RecipeRow>();

  const ingredientResult = await env.db.prepare(`
    SELECT ri.recipe_id AS recipeId, i.id AS ingredientId, i.name,
      i.normalized_name AS normalizedName, i.category,
      ri.quantity, ri.unit, ri.optional
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
    ...recipe,
    source: { type: recipe.sourceType, name: recipe.sourceName },
    tags: tagMap.get(recipe.id) ?? [],
    ingredients: (ingredientMap.get(recipe.id) ?? []).map((item) => ({
      ingredientId: item.ingredientId,
      name: item.name,
      normalizedName: item.normalizedName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      optional: Boolean(item.optional),
    })),
  })).sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
}

async function canonicalIngredientIds(env: Env, values: string[]): Promise<string[]> {
  const normalized = [...new Set(values.map(normalizeIngredient).filter(Boolean))].slice(0, 40);
  if (!normalized.length) return [];
  const mark = placeholders(normalized.length);
  const direct = await env.db.prepare(`SELECT id FROM ingredients WHERE normalized_name IN (${mark})`).bind(...normalized).all<{ id: string }>();
  const aliases = await env.db.prepare(`SELECT ingredient_id AS id FROM ingredient_aliases WHERE normalized_alias IN (${mark})`).bind(...normalized).all<{ id: string }>();
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
    const compatibility = required.length ? Math.round((found.length / required.length) * 100) : 0;
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
      tags: recipe.tags,
      compatibility,
      status: compatibility === 100 ? "READY" : compatibility >= 70 ? "ALMOST_READY" : compatibility >= 40 ? "NEAR" : "EXPLORE",
      foundIngredients: found.map((item) => ({ id: item.ingredientId, name: item.name })),
      missingIngredients: missing.map((item) => ({ id: item.ingredientId, name: item.name })),
      optionalIngredients: recipe.ingredients.filter((item) => item.optional).map((item) => ({ id: item.ingredientId, name: item.name })),
    };
  }).sort((a, b) => b.compatibility - a.compatibility || a.missingIngredients.length - b.missingIngredients.length || a.prepMinutes - b.prepMinutes || a.title.localeCompare(b.title, "pt-BR"));
}

async function matchFromRequest(request: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; }
  catch { return apiError(request, env, 400, "Dados inválidos."); }
  if (!Array.isArray(body.ingredients)) return apiError(request, env, 400, "ingredients deve ser uma lista.");
  const values = body.ingredients.filter((item): item is string => typeof item === "string").slice(0, 40);
  if (!values.length) return apiError(request, env, 400, "Informe pelo menos um ingrediente.");
  return json(request, env, await efficientMatch(env, await canonicalIngredientIds(env, values)));
}

async function matchFromPantry(request: Request, env: Env): Promise<Response> {
  const userId = await authenticatedUserId(request, env);
  if (!userId) return apiError(request, env, 401, "Entre na sua conta para usar sua despensa.");
  const rows = await env.db.prepare("SELECT ingredient_id AS ingredientId FROM pantry_items WHERE user_id = ? LIMIT 80").bind(userId).all<{ ingredientId: string }>();
  return json(request, env, await efficientMatch(env, rows.results.map((row) => row.ingredientId)));
}

async function listRecipes(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit")) || 36));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const search = normalizeIngredient(url.searchParams.get("q") ?? "");
  const rows = search
    ? await env.db.prepare(`SELECT id FROM recipes WHERE lower(title) LIKE ? ORDER BY title LIMIT ? OFFSET ?`).bind(`%${search}%`, limit, offset).all<{ id: string }>()
    : await env.db.prepare(`SELECT id FROM recipes ORDER BY updated_at DESC, title LIMIT ? OFFSET ?`).bind(limit, offset).all<{ id: string }>();
  return json(request, env, await loadRecipesByIds(env, rows.results.map((row) => row.id)));
}

async function recipeBySlug(request: Request, env: Env, slug: string): Promise<Response> {
  const row = await env.db.prepare("SELECT id FROM recipes WHERE slug = ? LIMIT 1").bind(slug).first<{ id: string }>();
  if (!row) return apiError(request, env, 404, "Receita não encontrada.");
  const recipes = await loadRecipesByIds(env, [row.id]);
  return json(request, env, recipes[0]);
}

async function listFavorites(request: Request, env: Env): Promise<Response> {
  const userId = await authenticatedUserId(request, env);
  if (!userId) return apiError(request, env, 401, "Entre na sua conta para acessar favoritos.");
  const rows = await env.db.prepare("SELECT recipe_id AS recipeId FROM favorites WHERE user_id = ? ORDER BY created_at DESC LIMIT 80").bind(userId).all<{ recipeId: string }>();
  return json(request, env, await loadRecipesByIds(env, rows.results.map((row) => row.recipeId)));
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    if (request.method === "POST" && path === "/api/recipes/match") return matchFromRequest(request, env);
    if (request.method === "GET" && path === "/api/recipes/match/pantry") return matchFromPantry(request, env);
    if (request.method === "GET" && path === "/api/recipes") return listRecipes(request, env);
    if (request.method === "GET" && path.startsWith("/api/recipes/")) return recipeBySlug(request, env, decodeURIComponent(path.slice("/api/recipes/".length)));
    if (request.method === "GET" && path === "/api/favorites") return listFavorites(request, env);
    return socialWorker.fetch(request, env);
  },
};
