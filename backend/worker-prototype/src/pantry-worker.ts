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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/api/pantry" || path.startsWith("/api/pantry/")) {
      if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
      const user = await authenticatedUser(request, env);
      if (!user) return apiError(request, env, 401, "Entre na sua conta para acessar a despensa.");
      if (request.method === "GET" && path === "/api/pantry") return listPantry(request, env, user);
      if (request.method === "POST" && path === "/api/pantry") return addPantryItem(request, env, user);
      if (request.method === "DELETE" && path.startsWith("/api/pantry/")) {
        return removePantryItem(request, env, user, decodeURIComponent(path.slice("/api/pantry/".length)));
      }
      return apiError(request, env, 405, "Método não permitido.");
    }

    return baseWorker.fetch(request, env);
  },
};
