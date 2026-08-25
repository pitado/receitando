import baseWorker from "./home-worker";
import {
  clearRateLimitEvents,
  clientIp,
  getRateLimitStatus,
  recordRateLimitEvent,
} from "./lib/auth-rate-limit";

interface Env {
  db: D1Database;
  FRONTEND_URL: string;
}

function allowedOrigins(env: Env): string[] {
  return env.FRONTEND_URL.split(",").map((value) => value.trim()).filter(Boolean);
}

function tooManyRequests(request: Request, env: Env, retryAfterSeconds: number): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Retry-After": String(Math.max(1, retryAfterSeconds)),
    Vary: "Origin",
  });
  const origin = request.headers.get("Origin");
  if (origin && allowedOrigins(env).includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return new Response(
    JSON.stringify({
      statusCode: 429,
      message: "Muitas tentativas em pouco tempo. Aguarde e tente novamente.",
    }),
    { status: 429, headers },
  );
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.clone().json();
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const body = await readBody(request);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const ip = clientIp(request);

  const emailStatus = email
    ? await getRateLimitStatus(env.db, "login_email", email)
    : { attempts: 0, blocked: false, retryAfterSeconds: 0 };
  const ipStatus = ip
    ? await getRateLimitStatus(env.db, "login_ip", ip)
    : { attempts: 0, blocked: false, retryAfterSeconds: 0 };

  if (emailStatus.blocked || ipStatus.blocked) {
    return tooManyRequests(
      request,
      env,
      Math.max(emailStatus.retryAfterSeconds, ipStatus.retryAfterSeconds),
    );
  }

  const response = await baseWorker.fetch(request, env);

  if (response.status === 401) {
    if (email) await recordRateLimitEvent(env.db, "login_email", email);
    if (ip) await recordRateLimitEvent(env.db, "login_ip", ip);
  } else if (response.ok && email) {
    await clearRateLimitEvents(env.db, "login_email", email);
  }

  return response;
}

async function handleRegister(request: Request, env: Env): Promise<Response> {
  const ip = clientIp(request);
  if (ip) {
    const status = await getRateLimitStatus(env.db, "register_ip", ip);
    if (status.blocked) return tooManyRequests(request, env, status.retryAfterSeconds);
  }

  const response = await baseWorker.fetch(request, env);

  if (ip && (response.status === 201 || response.status === 409)) {
    await recordRateLimitEvent(env.db, "register_ip", ip);
  }

  return response;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "POST" && path === "/api/auth/login") {
      return handleLogin(request, env);
    }
    if (request.method === "POST" && path === "/api/auth/register") {
      return handleRegister(request, env);
    }

    return baseWorker.fetch(request, env);
  },
};
