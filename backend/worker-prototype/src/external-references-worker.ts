import { json, type Env } from "./lib/worker-http";

type ExternalReference = {
  id: string;
  title: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  sourceAuthor: string | null;
  termsUrl: string;
  rights: "link_only";
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET") return json(request, env, { message: "Método não permitido." }, 405);
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
    const source = (url.searchParams.get("source") ?? "").trim().slice(0, 60);
    const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit")) || 48));
    const offset = Math.min(10000, Math.max(0, Number(url.searchParams.get("offset")) || 0));
    const filter = "WHERE (lower(title) LIKE lower(?) OR lower(category) LIKE lower(?)) AND (? = '' OR source_name = ?)";
    const search = "%" + query.replace(/[\\%_]/g, "\\$&") + "%";
    const params = [search, search, source, source];
    const count = await env.db.prepare(
      `SELECT COUNT(*) AS total FROM external_recipe_references ${filter}`
    ).bind(...params).first<{ total: number }>();
    const result = await env.db.prepare(
      `SELECT id, title, category, source_name AS "sourceName",
        source_url AS "sourceUrl", source_author AS "sourceAuthor",
        terms_url AS "termsUrl", rights
      FROM external_recipe_references ${filter}
      ORDER BY title ASC LIMIT ? OFFSET ?`
    ).bind(...params, limit, offset).all<ExternalReference>();
    return json(request, env, {
      items: result.results,
      pagination: { total: Number(count?.total ?? 0), limit, offset },
      notice: "Apenas indicações e links. Textos, imagens e modos de preparo pertencem às fontes."
    });
  }
};
