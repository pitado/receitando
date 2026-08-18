import pantryWorker from "./pantry-worker";

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

async function recipeIdFromSlug(env: Env, slug: string): Promise<string | null> {
  const recipe = await env.db
    .prepare("SELECT id FROM recipes WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<{ id: string }>();
  return recipe?.id ?? null;
}

async function communitySnapshot(request: Request, env: Env, slug: string): Promise<Response> {
  const recipeId = await recipeIdFromSlug(env, slug);
  if (!recipeId) return apiError(request, env, 404, "Receita não encontrada.");

  const user = await authenticatedUser(request, env);
  const reactionRows = await env.db
    .prepare(
      `SELECT
         SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) AS likes,
         SUM(CASE WHEN value = -1 THEN 1 ELSE 0 END) AS dislikes
       FROM recipe_reactions WHERE recipe_id = ?`,
    )
    .bind(recipeId)
    .first<{ likes: number | null; dislikes: number | null }>();

  const comments = await env.db
    .prepare(
      `SELECT c.id, c.body, c.created_at AS createdAt, c.updated_at AS updatedAt,
              u.id AS userId, u.name AS userName
       FROM recipe_comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.recipe_id = ?
       ORDER BY c.created_at DESC
       LIMIT 100`,
    )
    .bind(recipeId)
    .all<{ id: string; body: string; createdAt: string; updatedAt: string; userId: string; userName: string }>();

  let myReaction: number | null = null;
  if (user) {
    const own = await env.db
      .prepare("SELECT value FROM recipe_reactions WHERE user_id = ? AND recipe_id = ? LIMIT 1")
      .bind(user.id, recipeId)
      .first<{ value: number }>();
    myReaction = own?.value ?? null;
  }

  const likes = Number(reactionRows?.likes ?? 0);
  const dislikes = Number(reactionRows?.dislikes ?? 0);
  return json(request, env, {
    recipeId,
    likes,
    dislikes,
    score: likes - dislikes,
    commentsCount: comments.results.length,
    myReaction,
    comments: comments.results.map((comment) => ({
      ...comment,
      canDelete: Boolean(user && (user.id === comment.userId || user.role === "ADMIN")),
    })),
  });
}

async function setReaction(request: Request, env: Env, slug: string): Promise<Response> {
  const user = await authenticatedUser(request, env);
  if (!user) return apiError(request, env, 401, "Entre na sua conta para avaliar a receita.");
  const recipeId = await recipeIdFromSlug(env, slug);
  if (!recipeId) return apiError(request, env, 404, "Receita não encontrada.");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError(request, env, 400, "Dados inválidos.");
  }
  const value = body.value;
  if (value !== 1 && value !== -1) return apiError(request, env, 400, "A avaliação deve ser gostei ou não gostei.");

  const now = new Date().toISOString();
  await env.db
    .prepare(
      `INSERT INTO recipe_reactions (user_id, recipe_id, value, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id, recipe_id)
       DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind(user.id, recipeId, value, now, now)
    .run();
  return communitySnapshot(request, env, slug);
}

async function removeReaction(request: Request, env: Env, slug: string): Promise<Response> {
  const user = await authenticatedUser(request, env);
  if (!user) return apiError(request, env, 401, "Entre na sua conta para avaliar a receita.");
  const recipeId = await recipeIdFromSlug(env, slug);
  if (!recipeId) return apiError(request, env, 404, "Receita não encontrada.");
  await env.db.prepare("DELETE FROM recipe_reactions WHERE user_id = ? AND recipe_id = ?").bind(user.id, recipeId).run();
  return communitySnapshot(request, env, slug);
}

async function addComment(request: Request, env: Env, slug: string): Promise<Response> {
  const user = await authenticatedUser(request, env);
  if (!user) return apiError(request, env, 401, "Entre na sua conta para comentar.");
  const recipeId = await recipeIdFromSlug(env, slug);
  if (!recipeId) return apiError(request, env, 404, "Receita não encontrada.");

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError(request, env, 400, "Dados inválidos.");
  }
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (text.length < 2) return apiError(request, env, 400, "Escreva um comentário antes de enviar.");
  if (text.length > 1000) return apiError(request, env, 400, "O comentário pode ter no máximo 1000 caracteres.");

  const now = new Date().toISOString();
  await env.db
    .prepare(
      "INSERT INTO recipe_comments (id, user_id, recipe_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(crypto.randomUUID(), user.id, recipeId, text, now, now)
    .run();
  return communitySnapshot(request, env, slug);
}

async function removeComment(request: Request, env: Env, commentId: string): Promise<Response> {
  const user = await authenticatedUser(request, env);
  if (!user) return apiError(request, env, 401, "Entre na sua conta para remover comentários.");
  const comment = await env.db
    .prepare("SELECT id, user_id AS userId, recipe_id AS recipeId FROM recipe_comments WHERE id = ? LIMIT 1")
    .bind(commentId)
    .first<{ id: string; userId: string; recipeId: string }>();
  if (!comment) return apiError(request, env, 404, "Comentário não encontrado.");
  if (comment.userId !== user.id && user.role !== "ADMIN") return apiError(request, env, 403, "Você não pode remover este comentário.");

  const recipe = await env.db.prepare("SELECT slug FROM recipes WHERE id = ? LIMIT 1").bind(comment.recipeId).first<{ slug: string }>();
  await env.db.prepare("DELETE FROM recipe_comments WHERE id = ?").bind(commentId).run();
  if (!recipe) return json(request, env, { ok: true });
  return communitySnapshot(request, env, recipe.slug);
}

function recipeCommunityRoute(path: string): { slug: string; action: "community" | "reaction" | "comments" } | null {
  const match = path.match(/^\/api\/recipes\/([^/]+)\/(community|reaction|comments)$/);
  if (!match) return null;
  return { slug: decodeURIComponent(match[1]), action: match[2] as "community" | "reaction" | "comments" };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });

    const route = recipeCommunityRoute(path);
    if (route) {
      if (route.action === "community" && request.method === "GET") return communitySnapshot(request, env, route.slug);
      if (route.action === "reaction" && request.method === "POST") return setReaction(request, env, route.slug);
      if (route.action === "reaction" && request.method === "DELETE") return removeReaction(request, env, route.slug);
      if (route.action === "comments" && request.method === "POST") return addComment(request, env, route.slug);
      return apiError(request, env, 405, "Método não permitido.");
    }

    if (request.method === "DELETE" && path.startsWith("/api/comments/")) {
      return removeComment(request, env, decodeURIComponent(path.slice("/api/comments/".length)));
    }

    return pantryWorker.fetch(request, env);
  },
};
