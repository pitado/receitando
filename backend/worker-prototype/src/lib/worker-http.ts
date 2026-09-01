import { sha256 } from "./security";

export interface Env {
  db: D1Database;
  FRONTEND_URL: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  RECIPE_IMAGES?: R2Bucket;
}

export function allowedOrigins(env: Env): string[] {
  return env.FRONTEND_URL.split(",").map((value) => value.trim()).filter(Boolean);
}

export function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  });

  const origin = request.headers.get("Origin");
  if (origin && allowedOrigins(env).includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return headers;
}

export function json(request: Request, env: Env, body: unknown, status = 200): Response {
  const headers = corsHeaders(request, env);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(body), { status, headers });
}

export function empty(request: Request, env: Env, status = 204): Response {
  return new Response(null, { status, headers: corsHeaders(request, env) });
}

export function apiError(request: Request, env: Env, status: number, message: string): Response {
  return json(request, env, { statusCode: status, message }, status);
}

export function bearerToken(request: Request): string | undefined {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return undefined;
  const token = authorization.slice(7).trim();
  return token || undefined;
}

export async function tokenHashFromRequest(request: Request, env: Env): Promise<string | null> {
  const token = bearerToken(request);
  return token ? sha256(token) : null;
}

export async function authenticatedUserId(request: Request, env: Env): Promise<string | null> {
  const tokenHash = await tokenHashFromRequest(request, env);
  if (!tokenHash) return null;

  const row = await env.db.prepare(`
    SELECT user_id AS userId
    FROM sessions
    WHERE token_hash = ? AND expires_at > ?
    LIMIT 1
  `).bind(tokenHash, new Date().toISOString()).first<{ userId: string }>();

  return row?.userId ?? null;
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
