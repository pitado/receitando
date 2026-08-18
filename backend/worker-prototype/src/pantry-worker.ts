import baseWorker from "./index";

interface Env {
  db: D1Database;
  FRONTEND_URL: string;
}

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

type RecipeRow = {
  recipeId: string;
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
  ingredientId: string;
  ingredientName: string;
  normalizedName: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  optional: number;
};

type Recipe = {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  prepMinutes: number;
  servings: number;
  mealType: string;
  difficulty: "FACIL" | "MEDIA" | "DIFICIL";
  source: { type: "OWN" | "OPEN_DATASET" | "USER"; name: string };
  imageUrl: string | null;
  tags: string[];
  ingredients: Array<{
    ingredientId: string;
    name: string;
    normalizedName: string;
    category: string;
    quantity: number | null;
    unit: string | null;
    optional: boolean;
  }>;
};

const encoder = new TextEncoder();

function allowedOrigins(env: Env): string[] {
  return env.FRONTEND_URL.split(",").map((value) => value.trim()).filter(Boolean);
}

function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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

function normalizeIngredient(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
}

function bearerToken(request: Request): string | undefined {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return undefined;
  return authorization.slice(7).trim() || undefined;
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

async function authenticatedUser(request: Request, env: Env): Promise<UserRow | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  return (
    (await env.db
      .prepare(
        `SELECT u.id, u.name, u.email, u.role
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`,
      )
      .bind(tokenHash, now)
      .first<UserRow>()) ?? null
  );
}

async function listPantry(request: Request, env: Env, user: UserRow): Promise<Response> {
  const result = await env.db
    .prepare(
      `SELECT p.id, p.quantity, p.unit, p.expires_at AS expiresAt,
              p.created_at AS createdAt, p.updated_at AS updatedAt,
              i.id AS ingredientId, i.name AS ingredientName,
              i.normalized_name AS normalizedName, i.category
       FROM pantry_items p
       JOIN ingredients i ON i.id = p.ingredient_id
       WHERE p.user_id = ?
       ORDER BY i.name ASC`,
    )
    .bind(user.id)
    .all();
  return json(request, env, result.results);
}

async function addPantryItem(request: Request, env: Env, user: UserRow): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError(request, env, 400, "Dados inválidos.");
  }

  const ingredientId = typeof body.ingredientId === "string" ? body.ingredientId.trim() : "";
  const quantity = typeof body.quantity === "number" && Number.isFinite(body.quantity) ? body.quantity : null;
  const unit = typeof body.unit === "string" ? body.unit.trim().slice(0, 40) : null;

  if (!ingredientId) return apiError(request, env, 400, "Selecione um ingrediente.");
  const ingredient = await env.db.prepare("SELECT id FROM ingredients WHERE id = ? LIMIT 1").bind(ingredientId).first();
  if (!ingredient) return apiError(request, env, 404, "Ingrediente não encontrado.");

  const existing = await env.db
    .prepare("SELECT id FROM pantry_items WHERE user_id = ? AND ingredient_id = ? LIMIT 1")
    .bind(user.id, ingredientId)
    .first<{ id: string }>();
  const now = new Date().toISOString();

  if (existing) {
    await env.db
      .prepare("UPDATE pantry_items SET quantity = ?, unit = ?, updated_at = ? WHERE id = ?")
      .bind(quantity, unit || null, now, existing.id)
      .run();
  } else {
    await env.db
      .prepare(
        "INSERT INTO pantry_items (id, user_id, ingredient_id, quantity, unit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(crypto.randomUUID(), user.id, ingredientId, quantity, unit || null, now, now)
      .run();
  }

  return listPantry(request, env, user);
}

async function removePantryItem(request: Request, env: Env, user: UserRow, id: string): Promise<Response> {
  await env.db.prepare("DELETE FROM pantry_items WHERE id = ? AND user_id = ?").bind(id, user.id).run();
  return listPantry(request, env, user);
}

async function loadRecipes(env: Env, slug?: string): Promise<Recipe[]> {
  const sql = `SELECT
      r.id AS recipeId, r.title, r.slug, r.description, r.instructions,
      r.prep_minutes AS prepMinutes, r.servings,
      r.meal_type AS mealType, r.difficulty, r.source_type AS sourceType,
      r.source_name AS sourceName, r.image_url AS imageUrl,
      i.id AS ingredientId, i.name AS ingredientName,
      i.normalized_name AS normalizedName, i.category,
      ri.quantity, ri.unit, ri.optional
    FROM recipes r
    JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    JOIN ingredients i ON i.id = ri.ingredient_id
    ${slug ? "WHERE r.slug = ?" : ""}
    ORDER BY r.title, ri.optional, i.name`;
  const statement = env.db.prepare(sql);
  const result = slug ? await statement.bind(slug).all<RecipeRow>() : await statement.all<RecipeRow>();

  const tagRows = await env.db.prepare("SELECT recipe_id AS recipeId, tag FROM recipe_tags ORDER BY tag").all<{ recipeId: string; tag: string }>();
  const tagMap = new Map<string, string[]>();
  for (const row of tagRows.results) {
    const tags = tagMap.get(row.recipeId) ?? [];
    tags.push(row.tag);
    tagMap.set(row.recipeId, tags);
  }

  const map = new Map<string, Recipe>();
  for (const row of result.results) {
    let recipe = map.get(row.recipeId);
    if (!recipe) {
      recipe = {
        id: row.recipeId,
        title: row.title,
        slug: row.slug,
        description: row.description,
        instructions: row.instructions,
        prepMinutes: row.prepMinutes,
        servings: row.servings,
        mealType: row.mealType,
        difficulty: row.difficulty,
        source: { type: row.sourceType, name: row.sourceName },
        imageUrl: row.imageUrl,
        tags: tagMap.get(row.recipeId) ?? [],
        ingredients: [],
      };
      map.set(row.recipeId, recipe);
    }
    recipe.ingredients.push({
      ingredientId: row.ingredientId,
      name: row.ingredientName,
      normalizedName: row.normalizedName,
      category: row.category,
      quantity: row.quantity,
      unit: row.unit,
      optional: Boolean(row.optional),
    });
  }
  return [...map.values()];
}

async function canonicalIngredientIds(env: Env, values: string[]): Promise<Set<string>> {
  const normalized = new Set(values.map(normalizeIngredient).filter(Boolean));
  const ids = new Set<string>();
  if (normalized.size === 0) return ids;

  const ingredients = await env.db
    .prepare("SELECT id, normalized_name AS normalizedName FROM ingredients")
    .all<{ id: string; normalizedName: string }>();
  for (const row of ingredients.results) {
    if (normalized.has(normalizeIngredient(row.normalizedName))) ids.add(row.id);
  }

  const aliases = await env.db
    .prepare("SELECT ingredient_id AS ingredientId, normalized_alias AS normalizedAlias FROM ingredient_aliases")
    .all<{ ingredientId: string; normalizedAlias: string }>();
  for (const row of aliases.results) {
    if (normalized.has(normalizeIngredient(row.normalizedAlias))) ids.add(row.ingredientId);
  }
  return ids;
}

function matchRecipes(recipes: Recipe[], suppliedIds: Set<string>) {
  return recipes
    .map((recipe) => {
      const required = recipe.ingredients.filter((item) => !item.optional);
      const found = required.filter((item) => suppliedIds.has(item.ingredientId));
      const missing = required.filter((item) => !suppliedIds.has(item.ingredientId));
      const compatibility = required.length === 0 ? 0 : Math.round((found.length / required.length) * 100);
      const status = compatibility === 100 ? "READY" : compatibility >= 70 ? "ALMOST_READY" : compatibility >= 40 ? "NEAR" : "EXPLORE";
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
        status,
        foundIngredients: found.map((item) => ({ id: item.ingredientId, name: item.name })),
        missingIngredients: missing.map((item) => ({ id: item.ingredientId, name: item.name })),
        optionalIngredients: recipe.ingredients.filter((item) => item.optional).map((item) => ({ id: item.ingredientId, name: item.name })),
      };
    })
    .sort((a, b) => b.compatibility - a.compatibility || a.missingIngredients.length - b.missingIngredients.length || a.prepMinutes - b.prepMinutes || a.title.localeCompare(b.title, "pt-BR"));
}

async function matchFromBody(request: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError(request, env, 400, "Dados inválidos.");
  }
  if (!Array.isArray(body.ingredients)) return apiError(request, env, 400, "ingredients deve ser uma lista.");
  const values = body.ingredients.filter((item): item is string => typeof item === "string").slice(0, 100);
  if (values.length === 0) return apiError(request, env, 400, "Informe pelo menos um ingrediente.");
  return json(request, env, matchRecipes(await loadRecipes(env), await canonicalIngredientIds(env, values)));
}

async function matchFromPantry(request: Request, env: Env, user: UserRow): Promise<Response> {
  const pantry = await env.db.prepare("SELECT ingredient_id AS ingredientId FROM pantry_items WHERE user_id = ?").bind(user.id).all<{ ingredientId: string }>();
  const ids = new Set(pantry.results.map((item) => item.ingredientId));
  return json(request, env, matchRecipes(await loadRecipes(env), ids));
}

async function listFavorites(request: Request, env: Env, user: UserRow): Promise<Response> {
  const favoriteRows = await env.db.prepare("SELECT recipe_id AS recipeId FROM favorites WHERE user_id = ? ORDER BY created_at DESC").bind(user.id).all<{ recipeId: string }>();
  const ids = new Set(favoriteRows.results.map((row) => row.recipeId));
  const recipes = (await loadRecipes(env)).filter((recipe) => ids.has(recipe.id));
  return json(request, env, recipes);
}

async function addFavorite(request: Request, env: Env, user: UserRow): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError(request, env, 400, "Dados inválidos.");
  }
  const recipeId = typeof body.recipeId === "string" ? body.recipeId.trim() : "";
  if (!recipeId) return apiError(request, env, 400, "Informe a receita.");
  const recipe = await env.db.prepare("SELECT id FROM recipes WHERE id = ? LIMIT 1").bind(recipeId).first();
  if (!recipe) return apiError(request, env, 404, "Receita não encontrada.");
  await env.db.prepare("INSERT OR IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)").bind(user.id, recipeId).run();
  return listFavorites(request, env, user);
}

async function removeFavorite(request: Request, env: Env, user: UserRow, recipeId: string): Promise<Response> {
  await env.db.prepare("DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?").bind(user.id, recipeId).run();
  return listFavorites(request, env, user);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });

    if (path === "/api/pantry" || path.startsWith("/api/pantry/")) {
      const user = await authenticatedUser(request, env);
      if (!user) return apiError(request, env, 401, "Entre na sua conta para acessar a despensa.");
      if (request.method === "GET" && path === "/api/pantry") return listPantry(request, env, user);
      if (request.method === "POST" && path === "/api/pantry") return addPantryItem(request, env, user);
      if (request.method === "DELETE" && path.startsWith("/api/pantry/")) {
        return removePantryItem(request, env, user, decodeURIComponent(path.slice("/api/pantry/".length)));
      }
      return apiError(request, env, 405, "Método não permitido.");
    }

    if (request.method === "POST" && path === "/api/recipes/match") return matchFromBody(request, env);

    if (request.method === "GET" && path === "/api/recipes/match/pantry") {
      const user = await authenticatedUser(request, env);
      if (!user) return apiError(request, env, 401, "Entre na sua conta para usar sua despensa.");
      return matchFromPantry(request, env, user);
    }

    if (request.method === "GET" && path === "/api/recipes") return json(request, env, await loadRecipes(env));
    if (request.method === "GET" && path.startsWith("/api/recipes/")) {
      const slug = decodeURIComponent(path.slice("/api/recipes/".length));
      const recipes = await loadRecipes(env, slug);
      if (recipes.length === 0) return apiError(request, env, 404, "Receita não encontrada.");
      return json(request, env, recipes[0]);
    }

    if (path === "/api/favorites" || path.startsWith("/api/favorites/")) {
      const user = await authenticatedUser(request, env);
      if (!user) return apiError(request, env, 401, "Entre na sua conta para acessar favoritos.");
      if (request.method === "GET" && path === "/api/favorites") return listFavorites(request, env, user);
      if (request.method === "POST" && path === "/api/favorites") return addFavorite(request, env, user);
      if (request.method === "DELETE" && path.startsWith("/api/favorites/")) {
        return removeFavorite(request, env, user, decodeURIComponent(path.slice("/api/favorites/".length)));
      }
      return apiError(request, env, 405, "Método não permitido.");
    }

    return baseWorker.fetch(request, env);
  },
};
