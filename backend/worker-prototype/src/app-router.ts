import authRateLimitWorker from "./auth-rate-limit-worker";
import externalReferencesWorker from "./external-references-worker";
import catalogWorker from "./catalog64-worker";
import catalogV2Worker from "./catalog-v2-worker";
import homeWorker from "./home-worker";
import indexWorker from "./index";
import pantryWorker from "./pantry-worker";
import passwordResetWorker from "./password-reset-worker";
import profileWorker from "./profile-worker";
import recipeAdaptationWorker from "./recipe-adaptation-worker";
import recipeSubmissionWorker from "./recipe-submission-worker";
import socialWorker from "./social-worker";
import type { Env } from "./lib/worker-http";

function normalizedPath(request: Request): string {
  const pathname = new URL(request.url).pathname;
  return pathname.replace(/\/+$/, "") || "/";
}

function isRateLimitedAuthRoute(method: string, path: string): boolean {
  return (
    method === "POST" &&
    (path === "/api/auth/login" ||
      path === "/api/auth/register" ||
      path === "/api/auth/forgot-password")
  );
}

function isPasswordResetRoute(path: string): boolean {
  return (
    path === "/api/auth/verify-reset-code" ||
    path === "/api/auth/reset-password"
  );
}

function isProfileRoute(path: string): boolean {
  return path === "/api/auth/me";
}

function isPantryRoute(path: string): boolean {
  return path === "/api/pantry" || path.startsWith("/api/pantry/");
}

function isRecipeSubmissionRoute(path: string): boolean {
  return (
    path === "/api/recipe-submissions" ||
    path.startsWith("/api/recipe-submission-images/") ||
    path === "/api/admin/recipe-submissions" ||
    path.startsWith("/api/admin/recipe-submissions/")
  );
}

function isSocialRoute(path: string): boolean {
  return (
    /^\/api\/recipes\/[^/]+\/(social|vote|comments)$/.test(path) ||
    /^\/api\/recipe-comments\/[^/]+$/.test(path)
  );
}

function isRecipeAdaptationRoute(path: string): boolean {
  return /^\/api\/recipes\/[^/]+\/adapt$/.test(path);
}

function isCatalogRoute(path: string): boolean {
  return (
    path === "/api/recipes" ||
    path === "/api/recipes/match" ||
    path === "/api/recipes/match/pantry" ||
    /^\/api\/recipes\/[^/]+$/.test(path) ||
    path === "/api/ingredients" ||
    path === "/api/sources" ||
    path === "/api/favorites" ||
    path.startsWith("/api/favorites/")
  );
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = normalizedPath(request);

    if (path === "/api/v2/cooking-rooms" && request.method === "POST") {
      if (!env.COOKING_ROOMS) return Response.json({ message: "Salas indisponíveis" }, { status: 503 });
      const origin = request.headers.get("Origin");
      const { allowedOrigins } = await import("./lib/worker-http");
      if (origin && !allowedOrigins(env).includes(origin)) return new Response("Forbidden", { status: 403 });
      let data: { recipeSlug?: string; title?: string; steps?: string[] };
      try { data = await request.json(); } catch { return Response.json({ message: "Dados inválidos" }, { status: 400 }); }
      if (!data || typeof data.recipeSlug !== "string" || !/^[a-z0-9-]{1,120}$/.test(data.recipeSlug) ||
          typeof data.title !== "string" || !data.title.trim() || data.title.length > 160 || !Array.isArray(data.steps) ||
          data.steps.length < 1 || data.steps.length > 100 || data.steps.some(s => typeof s !== "string" || !s.trim() || s.length > 2000)) {
        return Response.json({ message: "Receita inválida" }, { status: 400 });
      }
      const id = crypto.randomUUID();
      const stub = env.COOKING_ROOMS.get(env.COOKING_ROOMS.idFromName(id));
      const result = await stub.fetch(new Request("https://room/init", { method: "POST", body: JSON.stringify(data) }));
      if (!result.ok) return Response.json({ message: "Não foi possível criar a sala" }, { status: 500 });
      return Response.json({ id }, { status: 201, headers: { "Cache-Control": "no-store" } });
    }
    const roomMatch = /^\/api\/v2\/cooking-rooms\/([a-f0-9-]{36})(?:\/(ws))?$/.exec(path);
    if (roomMatch && request.method === "GET") {
      if (!env.COOKING_ROOMS) return new Response("Unavailable", { status: 503 });
      const origin = request.headers.get("Origin");
      const { allowedOrigins } = await import("./lib/worker-http");
      if (origin && !allowedOrigins(env).includes(origin)) return new Response("Forbidden", { status: 403 });
      if (roomMatch[2] && request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
        return Response.json({ message: "Conexão WebSocket necessária" }, { status: 426 });
      }
      const stub = env.COOKING_ROOMS.get(env.COOKING_ROOMS.idFromName(roomMatch[1]));
      const target = new URL(request.url);
      target.pathname = roomMatch[2] ? "/ws" : "/state";
      return stub.fetch(new Request(target.toString(), request));
    }

    if (path === "/api/internal/load-benchmark") {
      // Ativado explicitamente somente no ambiente de teste; nunca exposto em produção.
      const benchmarkEnabled = (env as Env & { BENCHMARK_ENABLED?: string }).BENCHMARK_ENABLED === "true";
      if (!benchmarkEnabled) return new Response("Not found", { status: 404 });
      try {
        if (request.method === "POST") {
          const requestedId = request.headers.get("X-Benchmark-Id");
          if (requestedId && !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(requestedId)) {
            return Response.json({ ok: false, message: "Invalid benchmark id" }, { status: 400 });
          }
          // Chave opcional definida pelo k6: tentativas repetidas da mesma operação não duplicam escritas.
          const id = requestedId || crypto.randomUUID();
          await env.db.prepare("INSERT OR IGNORE INTO load_benchmark (id) VALUES (?)").bind(id).run();
          return Response.json({ ok: true, id }, { status: 201 });
        }
        if (request.method === "GET") {
          const requestedId = new URL(request.url).searchParams.get("id");
          if (requestedId !== null) {
            if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(requestedId)) {
              return Response.json({ ok: false, message: "Invalid benchmark id" }, { status: 400 });
            }
            // SELECT indexado: ler 2 milhões de vezes COUNT(*) seria uma carga artificial e crescente.
            const row = await env.db.prepare("SELECT id FROM load_benchmark WHERE id = ? LIMIT 1")
              .bind(requestedId).first<{ id: string }>();
            return Response.json({ ok: true, found: row?.id === requestedId });
          }
          // Somente validação inicial e final; não é usada nas 2 milhões de leituras.
          const row = await env.db.prepare("SELECT COUNT(*) AS total FROM load_benchmark").first<{ total: number }>();
          return Response.json({ ok: true, total: row?.total ?? 0 });
        }
        return new Response("Method not allowed", { status: 405 });
      } catch (error) {
        console.error("Local benchmark error", error);
        return Response.json({ ok: false }, { status: 500 });
      }
    }

    if (request.method === "OPTIONS") {
      return indexWorker.fetch(request, env);
    }

    if (isRateLimitedAuthRoute(request.method, path)) {
      return authRateLimitWorker.fetch(request, env);
    }

    if (path === "/api/home-feed") {
      return homeWorker.fetch(request, env);
    }

    if (path === "/api/recipe-references") {
      return externalReferencesWorker.fetch(request, env);
    }

    if (path === "/api/v2/recipes") {
      return catalogV2Worker.fetch(request, env);
    }

    if (isRecipeSubmissionRoute(path)) {
      return recipeSubmissionWorker.fetch(request, env);
    }

    if (isRecipeAdaptationRoute(path)) {
      return recipeAdaptationWorker.fetch(request, env);
    }

    if (isSocialRoute(path)) {
      return socialWorker.fetch(request, env);
    }

    if (isCatalogRoute(path)) {
      return catalogWorker.fetch(request, env);
    }

    if (isProfileRoute(path)) {
      return profileWorker.fetch(request, env);
    }

    if (isPasswordResetRoute(path)) {
      return passwordResetWorker.fetch(request, env);
    }

    if (isPantryRoute(path)) {
      return pantryWorker.fetch(request, env);
    }

    return indexWorker.fetch(request, env);
  },
};
