import { normalizeIngredient } from "./lib/recipe-utils";
import { apiError, type Env, json } from "./lib/worker-http";

type CatalogSort = "relevance" | "recent" | "popular" | "quick" | "title";
type RecipeDifficulty = "FACIL" | "MEDIA" | "DIFICIL";

type CatalogRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  prepMinutes: number;
  servings: number;
  mealType: string;
  difficulty: RecipeDifficulty;
  imageUrl: string | null;
  sourceName: string;
  externalSource: string | null;
};

type CatalogFilterState = {
  query: string;
  source: string;
  mealType: string;
  difficulty: RecipeDifficulty | "";
  maxPrepMinutes: number | null;
  sort: CatalogSort;
};

function placeholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(",");
}

function ftsRecipeQuery(value: string): string {
  const tokens = normalizeIngredient(value).match(/[a-z0-9]+/g) ?? [];
  return [...new Set(tokens)]
    .slice(0, 8)
    .map((token) => `"${token.replaceAll('"', '""')}"*`)
    .join(" AND ");
}

function positiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(max, Math.floor(parsed));
}

function nonNegativeInt(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function difficultyFrom(value: string | null): RecipeDifficulty | "" {
  const normalized = (value ?? "").trim().toUpperCase();
  if (normalized === "FACIL" || normalized === "MEDIA" || normalized === "DIFICIL") {
    return normalized;
  }
  return "";
}

function sortFrom(value: string | null, hasSearch: boolean): CatalogSort {
  const normalized = (value ?? "").trim().toLowerCase();
  if (
    normalized === "relevance" ||
    normalized === "recent" ||
    normalized === "popular" ||
    normalized === "quick" ||
    normalized === "title"
  ) {
    if (normalized === "relevance" && !hasSearch) return "recent";
    return normalized;
  }
  return hasSearch ? "relevance" : "recent";
}

function maxPrepMinutesFrom(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.min(1440, Math.floor(parsed));
}

function orderBy(sort: CatalogSort, hasSearch: boolean): string {
  if (sort === "relevance" && hasSearch) {
    return "bm25(recipe_search), r.title COLLATE NOCASE ASC";
  }
  if (sort === "popular") {
    return `(
      COALESCE((SELECT COUNT(*) FROM recipe_votes rv WHERE rv.recipe_id = r.id AND rv.vote = 'LIKE'), 0) * 4 +
      COALESCE((SELECT COUNT(*) FROM favorites f WHERE f.recipe_id = r.id), 0) * 3 +
      COALESCE((SELECT COUNT(*) FROM recipe_comments rc WHERE rc.recipe_id = r.id), 0)
    ) DESC, r.updated_at DESC, r.title COLLATE NOCASE ASC`;
  }
  if (sort === "quick") {
    return "CASE WHEN r.prep_minutes > 0 THEN 0 ELSE 1 END, r.prep_minutes ASC, r.title COLLATE NOCASE ASC";
  }
  if (sort === "title") {
    return "r.title COLLATE NOCASE ASC";
  }
  return "r.updated_at DESC, r.title COLLATE NOCASE ASC";
}

async function loadTags(env: Env, recipeIds: string[]): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (!recipeIds.length) return result;

  const marks = placeholders(recipeIds.length);
  const rows = await env.db
    .prepare(`
      SELECT recipe_id AS recipeId, tag
      FROM recipe_tags
      WHERE recipe_id IN (${marks})
      ORDER BY tag
    `)
    .bind(...recipeIds)
    .all<{ recipeId: string; tag: string }>();

  for (const row of rows.results) {
    const tags = result.get(row.recipeId) ?? [];
    tags.push(row.tag);
    result.set(row.recipeId, tags);
  }
  return result;
}

async function listCatalogV2(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = positiveInt(url.searchParams.get("limit"), 36, 60);
  const offset = nonNegativeInt(url.searchParams.get("offset"));
  const query = (url.searchParams.get("q") ?? "").trim();
  const search = ftsRecipeQuery(query);
  const source = (url.searchParams.get("source") ?? "").trim().toLowerCase();
  const mealType = (url.searchParams.get("mealType") ?? "").trim();
  const difficulty = difficultyFrom(url.searchParams.get("difficulty"));
  const maxPrepMinutes = maxPrepMinutesFrom(url.searchParams.get("maxPrepMinutes"));
  const sort = sortFrom(url.searchParams.get("sort"), Boolean(search));

  const fromParts = ["FROM recipes r"];
  const where: string[] = [];
  const bindings: Array<string | number> = [];

  if (search) {
    fromParts.push("JOIN recipe_search ON recipe_search.recipe_id = r.id");
    where.push("recipe_search MATCH ?");
    bindings.push(search);
  }
  if (source) {
    where.push("lower(r.external_source) = ?");
    bindings.push(source);
  }
  if (mealType) {
    where.push("lower(r.meal_type) = lower(?)");
    bindings.push(mealType);
  }
  if (difficulty) {
    where.push("r.difficulty = ?");
    bindings.push(difficulty);
  }
  if (maxPrepMinutes !== null) {
    where.push("r.prep_minutes > 0 AND r.prep_minutes <= ?");
    bindings.push(maxPrepMinutes);
  }

  const fromSql = fromParts.join(" ");
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const totalRow = await env.db
    .prepare(`SELECT COUNT(*) AS total ${fromSql} ${whereSql}`)
    .bind(...bindings)
    .first<{ total: number }>();
  const total = Number(totalRow?.total ?? 0);

  const rows = await env.db
    .prepare(`
      SELECT
        r.id,
        r.title,
        r.slug,
        r.description,
        r.prep_minutes AS prepMinutes,
        r.servings,
        r.meal_type AS mealType,
        r.difficulty,
        r.image_url AS imageUrl,
        r.source_name AS sourceName,
        r.external_source AS externalSource
      ${fromSql}
      ${whereSql}
      ORDER BY ${orderBy(sort, Boolean(search))}
      LIMIT ? OFFSET ?
    `)
    .bind(...bindings, limit, offset)
    .all<CatalogRow>();

  const tags = await loadTags(env, rows.results.map((row) => row.id));
  const items = rows.results.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    prepMinutes: row.prepMinutes,
    servings: row.servings,
    mealType: row.mealType,
    difficulty: row.difficulty,
    imageUrl: row.imageUrl,
    source: {
      name: row.sourceName,
      externalSource: row.externalSource,
    },
    tags: tags.get(row.id) ?? [],
  }));

  const filters: CatalogFilterState = {
    query,
    source,
    mealType,
    difficulty,
    maxPrepMinutes,
    sort,
  };

  return json(request, env, {
    items,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    },
    filters,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
    if (path !== "/api/v2/recipes") {
      return apiError(request, env, 404, "Rota não encontrada.");
    }
    if (request.method !== "GET") {
      return apiError(request, env, 405, "Método não permitido.");
    }
    return listCatalogV2(request, env);
  },
};
