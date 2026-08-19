import catalog64Worker from "./catalog64-worker";

interface Env {
  db: D1Database;
  FRONTEND_URL: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
}

function allowedOrigins(env: Env): string[] {
  return env.FRONTEND_URL.split(",").map((value) => value.trim()).filter(Boolean);
}

function corsHeaders(request: Request, env: Env): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
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

async function homeFeed(request: Request, env: Env): Promise<Response> {
  const popular = await env.db.prepare(`
    SELECT
      r.id,
      r.title,
      r.slug,
      r.description,
      r.prep_minutes AS prepMinutes,
      r.servings,
      r.meal_type AS mealType,
      r.difficulty,
      COALESCE(v.likes, 0) AS likes,
      COALESCE(f.favorites, 0) AS favorites,
      COALESCE(c.comments, 0) AS comments
    FROM recipes r
    LEFT JOIN (
      SELECT recipe_id, SUM(CASE WHEN vote = 'LIKE' THEN 1 ELSE 0 END) AS likes
      FROM recipe_votes GROUP BY recipe_id
    ) v ON v.recipe_id = r.id
    LEFT JOIN (
      SELECT recipe_id, COUNT(*) AS favorites
      FROM favorites GROUP BY recipe_id
    ) f ON f.recipe_id = r.id
    LEFT JOIN (
      SELECT recipe_id, COUNT(*) AS comments
      FROM recipe_comments GROUP BY recipe_id
    ) c ON c.recipe_id = r.id
    ORDER BY (COALESCE(v.likes, 0) * 3 + COALESCE(f.favorites, 0) * 2 + COALESCE(c.comments, 0)) DESC,
             r.updated_at DESC,
             r.title ASC
    LIMIT 4
  `).all();

  const recentComments = await env.db.prepare(`
    SELECT
      c.id,
      c.body,
      c.created_at AS createdAt,
      r.title AS recipeTitle,
      r.slug AS recipeSlug,
      u.name AS authorName,
      u.handle AS authorHandle,
      u.avatar_key AS avatarKey
    FROM recipe_comments c
    JOIN recipes r ON r.id = c.recipe_id
    JOIN users u ON u.id = c.user_id
    ORDER BY c.created_at DESC
    LIMIT 3
  `).all();

  const totals = await env.db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM recipes) AS recipes,
      (SELECT COUNT(*) FROM recipe_comments) AS comments,
      (SELECT COUNT(*) FROM recipe_votes WHERE vote = 'LIKE') AS likes
  `).first<{ recipes: number; comments: number; likes: number }>();

  return json(request, env, {
    popular: popular.results,
    recentComments: recentComments.results,
    totals: {
      recipes: Number(totals?.recipes ?? 0),
      comments: Number(totals?.comments ?? 0),
      likes: Number(totals?.likes ?? 0),
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    if (request.method === "GET" && path === "/api/home-feed") return homeFeed(request, env);

    return catalog64Worker.fetch(request, env);
  },
};
