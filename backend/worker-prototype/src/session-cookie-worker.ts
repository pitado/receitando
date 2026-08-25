import authRateLimitWorker from "./auth-rate-limit-worker";
import {
  buildExpiredSessionCookies,
  buildSessionCookie,
  isUnsafeMethod,
  sessionTokenFromCookie,
} from "./lib/session-cookie";

interface Env {
  db: D1Database;
  FRONTEND_URL: string;
}

function allowedOrigins(env: Env): string[] {
  return env.FRONTEND_URL.split(",").map((value) => value.trim()).filter(Boolean);
}

function isAllowedOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get("Origin");
  return Boolean(origin && allowedOrigins(env).includes(origin));
}

function withCredentialCors(request: Request, env: Env, response: Response): Response {
  const headers = new Headers(response.headers);
  if (isAllowedOrigin(request, env)) {
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Origin", request.headers.get("Origin")!);
    headers.set("Vary", "Origin");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function forbiddenOrigin(request: Request, env: Env): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    Vary: "Origin",
  });
  const origin = request.headers.get("Origin");
  if (origin && allowedOrigins(env).includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }
  return new Response(
    JSON.stringify({ statusCode: 403, message: "Origem não autorizada para esta operação." }),
    { status: 403, headers },
  );
}

async function rememberPreference(request: Request): Promise<boolean> {
  try {
    const body = (await request.clone().json()) as Record<string, unknown>;
    return body.remember === true;
  } catch {
    return false;
  }
}

function requestWithCookieAuthorization(request: Request, cookieToken: string | undefined): Request {
  if (!cookieToken || request.headers.has("Authorization")) return request;
  const headers = new Headers(request.headers);
  headers.set("Authorization", `Bearer ${cookieToken}`);
  return new Request(request, { headers });
}

async function attachSessionCookie(
  request: Request,
  env: Env,
  response: Response,
  remember: boolean,
): Promise<Response> {
  if (!response.ok) return withCredentialCors(request, env, response);

  let payload: unknown;
  try {
    payload = await response.clone().json();
  } catch {
    return withCredentialCors(request, env, response);
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("token" in payload) ||
    typeof payload.token !== "string" ||
    !payload.token
  ) {
    return withCredentialCors(request, env, response);
  }

  const token = payload.token;
  const { token: _hiddenToken, ...safePayload } = payload as Record<string, unknown>;
  void _hiddenToken;

  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", buildSessionCookie(request, token, remember));
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");

  const decorated = new Response(JSON.stringify(safePayload), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  return withCredentialCors(request, env, decorated);
}

function clearSessionCookie(request: Request, env: Env, response: Response): Response {
  const headers = new Headers(response.headers);
  for (const cookie of buildExpiredSessionCookies(request)) {
    headers.append("Set-Cookie", cookie);
  }
  const decorated = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
  return withCredentialCors(request, env, decorated);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const cookieToken = sessionTokenFromCookie(request);
    const origin = request.headers.get("Origin");

    // Requisições de navegador que alteram estado só são aceitas quando a
    // origem é explicitamente permitida. Isso cobre inclusive login/cadastro
    // (evitando login CSRF) e complementa SameSite=Strict nas sessões ativas.
    // Clientes não-browser sem Origin continuam podendo usar a API por Bearer.
    if (isUnsafeMethod(request.method) && origin && !isAllowedOrigin(request, env)) {
      return forbiddenOrigin(request, env);
    }

    const remember =
      request.method === "POST" &&
      (path === "/api/auth/login" || path === "/api/auth/register")
        ? await rememberPreference(request)
        : false;

    const authenticatedRequest = requestWithCookieAuthorization(request, cookieToken);
    const response = await authRateLimitWorker.fetch(authenticatedRequest, env);

    if (
      request.method === "POST" &&
      (path === "/api/auth/login" || path === "/api/auth/register")
    ) {
      return attachSessionCookie(request, env, response, remember);
    }

    if (request.method === "POST" && path === "/api/auth/logout") {
      return clearSessionCookie(request, env, response);
    }

    return withCredentialCors(request, env, response);
  },
};
