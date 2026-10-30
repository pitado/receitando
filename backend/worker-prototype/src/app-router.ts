import authRateLimitWorker from "./auth-rate-limit-worker";
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

    if (path === "/api/internal/load-benchmark") {
      const host = new URL(request.url).hostname;
      if (host !== "127.0.0.1" && host !== "localhost") {
        return new Response("Not found", { status: 404 });
      }
      try {
        if (request.method === "POST") {
          const id = crypto.randomUUID();
          await env.db.prepare("INSERT INTO load_benchmark (id) VALUES (?)").bind(id).run();
          return Response.json({ ok: true }, { status: 201 });
        }
        if (request.method === "GET") {
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
