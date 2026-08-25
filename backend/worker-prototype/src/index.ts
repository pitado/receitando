import { compatibilityPercent, normalizeIngredient } from "./lib/recipe-utils";
import { bytesToBase64Url, hashPassword, sha256, verifyPassword } from "./lib/security";

interface Env {
  db: D1Database;
  FRONTEND_URL: string;
}

type UserRole = "USER" | "ADMIN";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

type RecipeJoinRow = {
  recipe_id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  prep_minutes: number;
  servings: number;
  recipe_created_at: string;
  recipe_updated_at: string;
  recipe_ingredient_id: string;
  quantity: number | null;
  unit: string | null;
  optional: number;
  ingredient_id: string;
  ingredient_name: string;
  normalized_name: string;
  category: string;
};

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function allowedOrigins(env: Env): string[] {
  return env.FRONTEND_URL.split(",").map((value) => value.trim()).filter(Boolean);
}

function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  });
  const origin = request.headers.get("Origin");
  if (origin && allowedOrigins(env).includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}

function json(request: Request, env: Env, body: unknown, status = 200): Response {
  const headers = corsHeaders(request, env);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}

function empty(request: Request, env: Env, status = 204): Response {
  return new Response(null, { status, headers: corsHeaders(request, env) });
}

function apiError(request: Request, env: Env, status: number, message: string): Response {
  return json(request, env, { statusCode: status, message }, status);
}

function publicUser(user: UserRow) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function bearerToken(request: Request): string | undefined {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return undefined;
  const token = authorization.slice(7).trim();
  return token || undefined;
}

async function createSession(env: Env, userId: string) {
  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const now = new Date().toISOString();
  await env.db
    .prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), userId, tokenHash, expiresAt, now, now)
    .run();
  return { token, expiresAt };
}

async function authenticatedUser(request: Request, env: Env): Promise<UserRow | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const user = await env.db
    .prepare(
      `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`,
    )
    .bind(tokenHash, now)
    .first<UserRow>();
  if (user) {
    await env.db.prepare("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?").bind(now, tokenHash).run();
  }
  return user ?? null;
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 2 || name.length > 100) return apiError(request, env, 400, "Informe um nome válido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return apiError(request, env, 400, "Informe um e-mail válido.");
  if (password.length < 10 || password.length > 128) return apiError(request, env, 400, "A senha deve ter entre 10 e 128 caracteres.");

  const existing = await env.db.prepare("SELECT id FROM users WHERE email = ? LIMIT 1").bind(email).first();
  if (existing) return apiError(request, env, 409, "Já existe uma conta com este e-mail.");

  const now = new Date().toISOString();
  const user: UserRow = {
    id: crypto.randomUUID(),
    name,
    email,
    password_hash: await hashPassword(password),
    role: "USER",
    created_at: now,
    updated_at: now,
  };
  await env.db
    .prepare("INSERT INTO users (id, name, email, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(user.id, user.name, user.email, user.password_hash, user.role, now, now)
    .run();
  const session = await createSession(env, user.id);
  return json(request, env, { user: publicUser(user), ...session }, 201);
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || !password) return apiError(request, env, 400, "Informe e-mail e senha.");

  const user = await env.db.prepare("SELECT * FROM users WHERE email = ? LIMIT 1").bind(email).first<UserRow>();
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return apiError(request, env, 401, "E-mail ou senha inválidos.");
  }
  const session = await createSession(env, user.id);
  return json(request, env, { user: publicUser(user), ...session });
}

async function handleMe(request: Request, env: Env): Promise<Response> {
  const user = await authenticatedUser(request, env);
  if (!user) return apiError(request, env, 401, "Sessão inválida ou expirada.");
  return json(request, env, publicUser(user));
}

async function handleLogout(request: Request, env: Env): Promise<Response> {
  const token = bearerToken(request);
  if (token) {
    const tokenHash = await sha256(token);
    await env.db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  return empty(request, env);
}

async function recipeRows(env: Env, slug?: string): Promise<RecipeJoinRow[]> {
  const sql = `SELECT
    r.id AS recipe_id, r.title, r.slug, r.description, r.instructions,
    r.prep_minutes, r.servings, r.created_at AS recipe_created_at, r.updated_at AS recipe_updated_at,
    ri.id AS recipe_ingredient_id, ri.quantity, ri.unit, ri.optional,
    i.id AS ingredient_id, i.name AS ingredient_name, i.normalized_name, i.category
    FROM recipes r
    JOIN recipe_ingredients ri ON ri.recipe_id = r.id
    JOIN ingredients i ON i.id = ri.ingredient_id
    ${slug ? "WHERE r.slug = ?" : ""}
    ORDER BY r.title ASC, ri.optional ASC, i.name ASC`;
  const statement = env.db.prepare(sql);
  const result = slug ? await statement.bind(slug).all<RecipeJoinRow>() : await statement.all<RecipeJoinRow>();
  return result.results;
}

function groupRecipes(rows: RecipeJoinRow[]) {
  const recipes = new Map<string, {
    id: string;
    title: string;
    slug: string;
    description: string;
    instructions: string;
    prepMinutes: number;
    servings: number;
    ingredients: Array<{
      id: string;
      quantity: number | null;
      unit: string | null;
      optional: boolean;
      ingredient: { id: string; name: string; normalizedName: string; category: string };
    }>;
    createdAt: string;
    updatedAt: string;
  }>();

  for (const row of rows) {
    let recipe = recipes.get(row.recipe_id);
    if (!recipe) {
      recipe = {
        id: row.recipe_id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        instructions: row.instructions,
        prepMinutes: row.prep_minutes,
        servings: row.servings,
        ingredients: [],
        createdAt: row.recipe_created_at,
        updatedAt: row.recipe_updated_at,
      };
      recipes.set(row.recipe_id, recipe);
    }
    recipe.ingredients.push({
      id: row.recipe_ingredient_id,
      quantity: row.quantity,
      unit: row.unit,
      optional: Boolean(row.optional),
      ingredient: {
        id: row.ingredient_id,
        name: row.ingredient_name,
        normalizedName: row.normalized_name,
        category: row.category,
      },
    });
  }
  return [...recipes.values()];
}

async function handleListRecipes(request: Request, env: Env): Promise<Response> {
  return json(request, env, groupRecipes(await recipeRows(env)));
}

async function handleRecipeBySlug(request: Request, env: Env, slug: string): Promise<Response> {
  const recipes = groupRecipes(await recipeRows(env, decodeURIComponent(slug)));
  if (recipes.length === 0) return apiError(request, env, 404, "Receita não encontrada.");
  return json(request, env, recipes[0]);
}

async function handleIngredients(request: Request, env: Env): Promise<Response> {
  const result = await env.db
    .prepare("SELECT id, name, normalized_name AS normalizedName, category, created_at AS createdAt, updated_at AS updatedAt FROM ingredients ORDER BY name")
    .all();
  return json(request, env, result.results);
}

async function handleMatch(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  if (!Array.isArray(body?.ingredients)) return apiError(request, env, 400, "ingredients deve ser uma lista.");
  const supplied = [...new Set(body.ingredients.filter((item): item is string => typeof item === "string").map(normalizeIngredient).filter(Boolean))];
  if (supplied.length < 1 || supplied.length > 100) return apiError(request, env, 400, "Informe entre 1 e 100 ingredientes.");
  const suppliedSet = new Set(supplied);
  const recipes = groupRecipes(await recipeRows(env));
  const matches = recipes.map((recipe) => {
    const required = recipe.ingredients.filter((item) => !item.optional).map((item) => item.ingredient.normalizedName);
    const found = required.filter((name) => suppliedSet.has(name));
    const missing = required.filter((name) => !suppliedSet.has(name));
    return {
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      prepMinutes: recipe.prepMinutes,
      servings: recipe.servings,
      compatibility: compatibilityPercent(found.length, required.length),
      requiredIngredients: required,
      foundIngredients: found,
      missingIngredients: missing,
    };
  });
  matches.sort((first, second) => second.compatibility - first.compatibility || first.title.localeCompare(second.title, "pt-BR"));
  return json(request, env, matches);
}

async function route(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") return empty(request, env);
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "GET" && path === "/") {
    return json(request, env, { name: "Receitando API", status: "ok", docs: "/api/health" });
  }
  if (request.method === "GET" && path === "/api/health") return json(request, env, { status: "ok" });
  if (request.method === "POST" && path === "/api/auth/register") return handleRegister(request, env);
  if (request.method === "POST" && path === "/api/auth/login") return handleLogin(request, env);
  if (request.method === "GET" && path === "/api/auth/me") return handleMe(request, env);
  if (request.method === "POST" && path === "/api/auth/logout") return handleLogout(request, env);
  if (request.method === "GET" && path === "/api/ingredients") return handleIngredients(request, env);
  if (request.method === "GET" && path === "/api/recipes") return handleListRecipes(request, env);
  if (request.method === "POST" && path === "/api/recipes/match") return handleMatch(request, env);
  if (request.method === "GET" && path.startsWith("/api/recipes/slug/")) {
    return handleRecipeBySlug(request, env, path.slice("/api/recipes/slug/".length));
  }

  return apiError(request, env, 404, "Rota não encontrada.");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env);
    } catch (error) {
      console.error("Receitando API error", error);
      return apiError(request, env, 500, "Erro interno da API.");
    }
  },
};
