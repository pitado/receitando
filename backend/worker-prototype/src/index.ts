import { bytesToBase64Url, hashPassword, sha256, verifyPassword } from "./lib/security";
import {
  apiError,
  bearerToken,
  empty,
  type Env,
  json,
  readJson,
} from "./lib/worker-http";

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

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function publicUser(user: UserRow) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
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
    await env.db
      .prepare("UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?")
      .bind(now, tokenHash)
      .run();
  }

  return user ?? null;
}

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const body = await readJson(request);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (name.length < 2 || name.length > 100) {
    return apiError(request, env, 400, "Informe um nome válido.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return apiError(request, env, 400, "Informe um e-mail válido.");
  }
  if (password.length < 10 || password.length > 128) {
    return apiError(request, env, 400, "A senha deve ter entre 10 e 128 caracteres.");
  }

  const existing = await env.db
    .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
    .bind(email)
    .first();
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

  if (!email || !password) {
    return apiError(request, env, 400, "Informe e-mail e senha.");
  }

  const user = await env.db
    .prepare("SELECT * FROM users WHERE email = ? LIMIT 1")
    .bind(email)
    .first<UserRow>();

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
    await env.db
      .prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await sha256(token))
      .run();
  }
  return empty(request, env);
}

async function route(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") return empty(request, env);

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "GET" && path === "/") {
    return json(request, env, { name: "Receitando API", status: "ok", docs: "/api/health" });
  }
  if (request.method === "GET" && path === "/api/health") {
    return json(request, env, { status: "ok" });
  }
  if (request.method === "POST" && path === "/api/auth/register") {
    return handleRegister(request, env);
  }
  if (request.method === "POST" && path === "/api/auth/login") {
    return handleLogin(request, env);
  }
  if (request.method === "GET" && path === "/api/auth/me") {
    return handleMe(request, env);
  }
  if (request.method === "POST" && path === "/api/auth/logout") {
    return handleLogout(request, env);
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
