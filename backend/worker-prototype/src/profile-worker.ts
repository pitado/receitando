import passwordResetWorker from "./password-reset-validation-worker";

interface Env {
  db: D1Database;
  FRONTEND_URL: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

type UserRole = "USER" | "ADMIN";

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  handle: string | null;
  avatarKey: string;
};

const encoder = new TextEncoder();
const AVATAR_KEYS = new Set([
  "tomato",
  "lemon",
  "egg",
  "carrot",
  "strawberry",
  "bread",
  "avocado",
  "mushroom",
]);
const RESERVED_HANDLES = new Set(["admin", "api", "receitando", "suporte", "contato"]);

function allowedOrigins(env: Env): string[] {
  return env.FRONTEND_URL.split(",").map((value) => value.trim()).filter(Boolean);
}

function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
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

async function authenticatedProfile(request: Request, env: Env): Promise<ProfileRow | null> {
  const token = bearerToken(request);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const user = await env.db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.handle, u.avatar_key AS avatarKey
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?
       LIMIT 1`,
    )
    .bind(tokenHash, now)
    .first<ProfileRow>();

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

function normalizeHandle(value: string): string {
  return value
    .trim()
    .replace(/^@+/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

async function getProfile(request: Request, env: Env): Promise<Response> {
  const user = await authenticatedProfile(request, env);
  if (!user) return apiError(request, env, 401, "Sessão inválida ou expirada.");
  return json(request, env, user);
}

async function updateProfile(request: Request, env: Env): Promise<Response> {
  const user = await authenticatedProfile(request, env);
  if (!user) return apiError(request, env, 401, "Sessão inválida ou expirada.");

  const body = await readJson(request);
  if (!body) return apiError(request, env, 400, "Dados inválidos.");

  const name = typeof body.name === "string" ? body.name.trim() : user.name;
  const rawHandle = typeof body.handle === "string" ? body.handle : user.handle ?? "";
  const handle = normalizeHandle(rawHandle);
  const avatarKey = typeof body.avatarKey === "string" ? body.avatarKey.trim() : user.avatarKey;

  if (name.length < 2 || name.length > 100) {
    return apiError(request, env, 400, "Informe um nome entre 2 e 100 caracteres.");
  }
  if (!/^[a-z0-9][a-z0-9_]{2,23}$/.test(handle)) {
    return apiError(request, env, 400, "Seu @ deve ter de 3 a 24 caracteres e usar apenas letras, números ou _.");
  }
  if (RESERVED_HANDLES.has(handle)) {
    return apiError(request, env, 409, "Esse @ está reservado. Escolha outro.");
  }
  if (!AVATAR_KEYS.has(avatarKey)) {
    return apiError(request, env, 400, "Escolha um avatar válido do Receitando.");
  }

  const existing = await env.db
    .prepare("SELECT id FROM users WHERE handle = ? AND id <> ? LIMIT 1")
    .bind(handle, user.id)
    .first<{ id: string }>();
  if (existing) return apiError(request, env, 409, "Esse @ já está em uso. Experimente outro.");

  const now = new Date().toISOString();
  await env.db
    .prepare("UPDATE users SET name = ?, handle = ?, avatar_key = ?, updated_at = ? WHERE id = ?")
    .bind(name, handle, avatarKey, now, user.id)
    .run();

  return json(request, env, {
    id: user.id,
    name,
    email: user.email,
    role: user.role,
    handle,
    avatarKey,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (path === "/api/auth/me" && request.method === "GET") {
      return getProfile(request, env);
    }
    if (path === "/api/auth/me" && request.method === "PATCH") {
      return updateProfile(request, env);
    }

    return passwordResetWorker.fetch(request, env);
  },
};
