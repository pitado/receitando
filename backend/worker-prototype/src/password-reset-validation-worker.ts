import passwordResetWorker from "./password-reset-worker";

interface Env {
  db: D1Database;
  FRONTEND_URL: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

function allowedOrigins(env: Env): string[] {
  return env.FRONTEND_URL.split(",").map((value) => value.trim()).filter(Boolean);
}

function json(request: Request, env: Env, body: unknown, status = 200): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    Vary: "Origin",
  });
  const origin = request.headers.get("Origin");
  if (origin && allowedOrigins(env).includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }
  return new Response(JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "POST" && path === "/api/auth/forgot-password") {
      let body: Record<string, unknown> | null = null;
      try {
        const value = await request.clone().json();
        body = typeof value === "object" && value !== null && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : null;
      } catch {
        return json(request, env, { statusCode: 400, message: "Informe um e-mail válido." }, 400);
      }

      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return json(request, env, { statusCode: 400, message: "Informe um e-mail válido." }, 400);
      }

      const user = await env.db
        .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
        .bind(email)
        .first<{ id: string }>();

      if (!user) {
        return json(
          request,
          env,
          { statusCode: 404, message: "Não encontramos uma conta com este e-mail. Confira o endereço ou crie uma conta." },
          404,
        );
      }
    }

    return passwordResetWorker.fetch(request, env);
  },
};
