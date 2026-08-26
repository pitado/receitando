import passwordResetWorker from "./password-reset-worker";
import { sha256 } from "./lib/security";
import {
  apiError,
  bearerToken,
  corsHeaders,
  type Env,
  json,
  readJson,
} from "./lib/worker-http";

type UserRole = "USER" | "ADMIN";

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  handle: string | null;
  avatarKey: string;
};

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
    await env.db
      .prepare("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?")
      .bind(now, tokenHash)
      .run();
  }
  return user ?? null;
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
