import baseWorker from "./index";
import { sha256 } from "./lib/security";
import {
  apiError,
  bearerToken,
  corsHeaders,
  type Env,
  json,
  readJson,
} from "./lib/worker-http";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

async function authenticatedUser(request: Request, env: Env): Promise<UserRow | null> {
  const token = bearerToken(request);
  if (!token) return null;

  return (
    (await env.db
      .prepare(
        `SELECT u.id, u.name, u.email, u.role
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ? LIMIT 1`,
      )
      .bind(await sha256(token), new Date().toISOString())
      .first<UserRow>()) ?? null
  );
}

function normalizeExpirationDate(value: unknown): string | null | undefined {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;

  const parsed = new Date(`${trimmed}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== trimmed) {
    return undefined;
  }

  return trimmed;
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
       ORDER BY CASE WHEN p.expires_at IS NULL THEN 1 ELSE 0 END,
                p.expires_at ASC,
                i.name ASC`,
    )
    .bind(user.id)
    .all();

  return json(request, env, result.results);
}

async function addPantryItem(request: Request, env: Env, user: UserRow): Promise<Response> {
  const body = await readJson(request);
  if (!body) return apiError(request, env, 400, "Dados inválidos.");

  const ingredientId = typeof body.ingredientId === "string" ? body.ingredientId.trim() : "";
  const quantity = typeof body.quantity === "number" && Number.isFinite(body.quantity)
    ? body.quantity
    : null;
  const unit = typeof body.unit === "string" ? body.unit.trim().slice(0, 40) : null;
  const hasExpiresAt = Object.prototype.hasOwnProperty.call(body, "expiresAt");
  const expiresAt = hasExpiresAt ? normalizeExpirationDate(body.expiresAt) : undefined;

  if (!ingredientId) return apiError(request, env, 400, "Selecione um ingrediente.");
  if (hasExpiresAt && expiresAt === undefined) {
    return apiError(request, env, 400, "Informe uma data de validade válida.");
  }

  const ingredient = await env.db
    .prepare("SELECT id FROM ingredients WHERE id = ? LIMIT 1")
    .bind(ingredientId)
    .first();
  if (!ingredient) return apiError(request, env, 404, "Ingrediente não encontrado.");

  const existing = await env.db
    .prepare("SELECT id FROM pantry_items WHERE user_id = ? AND ingredient_id = ? LIMIT 1")
    .bind(user.id, ingredientId)
    .first<{ id: string }>();
  const now = new Date().toISOString();

  if (existing) {
    if (hasExpiresAt) {
      await env.db
        .prepare("UPDATE pantry_items SET quantity = ?, unit = ?, expires_at = ?, updated_at = ? WHERE id = ?")
        .bind(quantity, unit || null, expiresAt ?? null, now, existing.id)
        .run();
    } else {
      await env.db
        .prepare("UPDATE pantry_items SET quantity = ?, unit = ?, updated_at = ? WHERE id = ?")
        .bind(quantity, unit || null, now, existing.id)
        .run();
    }
  } else {
    await env.db
      .prepare(
        "INSERT INTO pantry_items (id, user_id, ingredient_id, quantity, unit, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(crypto.randomUUID(), user.id, ingredientId, quantity, unit || null, expiresAt ?? null, now, now)
      .run();
  }

  return listPantry(request, env, user);
}

async function removePantryItem(
  request: Request,
  env: Env,
  user: UserRow,
  id: string,
): Promise<Response> {
  await env.db
    .prepare("DELETE FROM pantry_items WHERE id = ? AND user_id = ?")
    .bind(id, user.id)
    .run();
  return listPantry(request, env, user);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (path === "/api/pantry" || path.startsWith("/api/pantry/")) {
      const user = await authenticatedUser(request, env);
      if (!user) {
        return apiError(request, env, 401, "Entre na sua conta para acessar a despensa.");
      }

      if (request.method === "GET" && path === "/api/pantry") {
        return listPantry(request, env, user);
      }
      if (request.method === "POST" && path === "/api/pantry") {
        return addPantryItem(request, env, user);
      }
      if (request.method === "DELETE" && path.startsWith("/api/pantry/")) {
        return removePantryItem(
          request,
          env,
          user,
          decodeURIComponent(path.slice("/api/pantry/".length)),
        );
      }
      return apiError(request, env, 405, "Método não permitido.");
    }

    return baseWorker.fetch(request, env);
  },
};
