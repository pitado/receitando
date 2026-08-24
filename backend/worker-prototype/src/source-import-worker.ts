import homeWorker from "./home-worker";

interface Env {
  db: D1Database;
  FRONTEND_URL: string;
  IMPORT_API_KEY?: string;
  THEMEALDB_API_KEY?: string;
}

type ImportSource = "themealdb";

type MealDbMeal = {
  idMeal?: string;
  strMeal?: string;
  strCategory?: string;
  strArea?: string;
  strInstructions?: string;
  strMealThumb?: string;
  [key: string]: unknown;
};

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

function importKey(request: Request): string {
  const authorization = request.headers.get("Authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
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

function mealIngredients(meal: MealDbMeal): Array<{ name: string; measure: string | null }> {
  const ingredients: Array<{ name: string; measure: string | null }> = [];
  for (let index = 1; index <= 20; index += 1) {
    const rawName = meal[`strIngredient${index}`];
    if (typeof rawName !== "string" || !rawName.trim()) continue;
    const rawMeasure = meal[`strMeasure${index}`];
    ingredients.push({
      name: rawName.trim(),
      measure: typeof rawMeasure === "string" && rawMeasure.trim() ? rawMeasure.trim() : null,
    });
  }
  return ingredients;
}

async function ensureIngredient(env: Env, name: string): Promise<string> {
  const normalized = normalizeIngredient(name);
  const existing = await env.db
    .prepare("SELECT id FROM ingredients WHERE normalized_name = ? LIMIT 1")
    .bind(normalized)
    .first<{ id: string }>();
  if (existing) return existing.id;

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.db
    .prepare(
      "INSERT INTO ingredients (id, name, normalized_name, category, created_at, updated_at) VALUES (?, ?, ?, 'importado', ?, ?)",
    )
    .bind(id, name, normalized, now, now)
    .run();
  return id;
}

async function upsertMeal(env: Env, meal: MealDbMeal): Promise<{ id: string; slug: string }> {
  const externalId = String(meal.idMeal ?? "").trim();
  const title = String(meal.strMeal ?? "").trim();
  if (!externalId || !title) throw new Error("Receita sem id ou título.");

  const existing = await env.db
    .prepare("SELECT id, slug FROM recipes WHERE external_source = 'themealdb' AND external_id = ? LIMIT 1")
    .bind(externalId)
    .first<{ id: string; slug: string }>();

  const id = existing?.id ?? crypto.randomUUID();
  const baseSlug = slugify(title) || `receita-${externalId}`;
  const slug = existing?.slug ?? `${baseSlug}-${externalId}`;
  const description = [meal.strCategory, meal.strArea]
    .filter((value) => typeof value === "string" && value.trim())
    .join(" · ") || "Receita importada.";
  const instructions = typeof meal.strInstructions === "string" ? meal.strInstructions.trim() : "";
  const imageUrl = typeof meal.strMealThumb === "string" && meal.strMealThumb.trim() ? meal.strMealThumb.trim() : null;
  const now = new Date().toISOString();

  if (existing) {
    await env.db
      .prepare(
        `UPDATE recipes
         SET title = ?, description = ?, instructions = ?, source_type = 'OPEN_DATASET', source_name = 'TheMealDB',
             image_url = ?, external_category = ?, external_subcategory = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(title, description, instructions, imageUrl, meal.strCategory ?? null, meal.strArea ?? null, now, id)
      .run();
    await env.db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").bind(id).run();
  } else {
    await env.db
      .prepare(
        `INSERT INTO recipes
         (id, title, slug, description, instructions, prep_minutes, servings, created_at, updated_at,
          meal_type, difficulty, source_type, source_name, image_url, external_source, external_id,
          external_category, external_subcategory)
         VALUES (?, ?, ?, ?, ?, 0, 1, ?, ?, 'outros', 'FACIL', 'OPEN_DATASET', 'TheMealDB', ?, 'themealdb', ?, ?, ?)`,
      )
      .bind(id, title, slug, description, instructions, now, now, imageUrl, externalId, meal.strCategory ?? null, meal.strArea ?? null)
      .run();
  }

  for (const item of mealIngredients(meal)) {
    const ingredientId = await ensureIngredient(env, item.name);
    await env.db
      .prepare(
        `INSERT INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional)
         VALUES (?, ?, ?, NULL, ?, 0)`,
      )
      .bind(crypto.randomUUID(), id, ingredientId, item.measure)
      .run();
  }

  return { id, slug };
}

async function importTheMealDb(env: Env, query: string, limit: number) {
  if (!env.THEMEALDB_API_KEY) throw new Error("THEMEALDB_API_KEY não configurada.");

  const url = `https://www.themealdb.com/api/json/v1/${encodeURIComponent(env.THEMEALDB_API_KEY)}/search.php?s=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Receitando/1.0" },
  });
  if (!response.ok) throw new Error(`TheMealDB respondeu ${response.status}.`);

  const payload = (await response.json()) as { meals?: MealDbMeal[] | null };
  const meals = Array.isArray(payload.meals) ? payload.meals.slice(0, limit) : [];
  const imported: Array<{ id: string; slug: string }> = [];
  for (const meal of meals) imported.push(await upsertMeal(env, meal));
  return imported;
}

function sourcePayload() {
  return {
    sources: [
      {
        id: "themealdb",
        name: "TheMealDB",
        mode: "official-api",
        enabled: true,
        stores: ["title", "description", "instructions", "ingredients", "image", "source"],
      },
    ],
    policy: "O Receitando integra somente fontes cujo uso por API, licença ou autorização permita reutilização do conteúdo.",
  };
}

async function handleImport(request: Request, env: Env): Promise<Response> {
  if (!env.IMPORT_API_KEY || importKey(request) !== env.IMPORT_API_KEY) {
    return json(request, env, { statusCode: 401, message: "Chave de importação inválida." }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(request, env, { statusCode: 400, message: "JSON inválido." }, 400);
  }

  const source = body.source as ImportSource;
  const query = typeof body.query === "string" ? body.query.trim() : "";
  const limit = Math.min(25, Math.max(1, Number(body.limit) || 10));
  if (source !== "themealdb") {
    return json(request, env, { statusCode: 400, message: "Fonte não suportada." }, 400);
  }

  try {
    const imported = await importTheMealDb(env, query, limit);
    return json(request, env, { source, query, imported: imported.length, recipes: imported }, 201);
  } catch (error) {
    console.error("Recipe import failed", error);
    return json(request, env, { statusCode: 502, message: "Não foi possível importar receitas desta fonte agora." }, 502);
  }
}

function rewriteRequest(request: Request, pathname: string): Request {
  const url = new URL(request.url);
  url.pathname = pathname;
  return new Request(url.toString(), request);
}

function publicApiPath(path: string): string | null {
  if (path === "/api/v1/health") return "/api/health";
  if (path === "/api/v1/home") return "/api/home-feed";
  if (path === "/api/v1/ingredients") return "/api/ingredients";
  if (path === "/api/v1/recipes") return "/api/recipes";
  if (path === "/api/v1/match") return "/api/recipes/match";
  if (path.startsWith("/api/v1/recipes/")) return `/api/recipes/${path.slice("/api/v1/recipes/".length)}`;
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (request.method === "GET" && (path === "/api/sources" || path === "/api/v1/sources")) {
      return json(request, env, sourcePayload());
    }
    if (request.method === "POST" && path === "/api/internal/import-recipes") {
      return handleImport(request, env);
    }

    const rewrittenPath = publicApiPath(path);
    if (rewrittenPath) return homeWorker.fetch(rewriteRequest(request, rewrittenPath), env);

    return homeWorker.fetch(request, env);
  },
};
