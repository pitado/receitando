const SITE_URL = "https://receitando.miguelpita.com.br";
const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  "https://api.receitando.miguelpita.com.br"
).replace(/\/$/, "");
const PAGE_SIZE = 60;

// Consulta as receitas na API atual, sem depender da quantidade que havia no build.
export const dynamic = "force-dynamic";

interface CatalogResponse {
  items: Array<{ slug: string }>;
  pagination: { total: number; hasMore: boolean };
}

async function fetchRecipes(offset: number): Promise<CatalogResponse> {
  const url = new URL("/api/v2/recipes", API_URL);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("sort", "title");

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`API do catálogo retornou ${response.status}`);

  const data = (await response.json()) as Partial<CatalogResponse>;
  if (
    !Array.isArray(data.items) ||
    !data.pagination ||
    !Number.isSafeInteger(data.pagination.total) ||
    data.pagination.total < 0
  ) {
    throw new Error("Formato inesperado da API de receitas");
  }

  return data as CatalogResponse;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(): Promise<Response> {
  try {
    const firstPage = await fetchRecipes(0);
    const items = [...firstPage.items];

    // Paginação em grupos pequenos para não sobrecarregar o banco/API.
    const total = firstPage.pagination.total;
    for (let start = PAGE_SIZE; start < total; start += PAGE_SIZE * 4) {
      const offsets: number[] = [];
      for (
        let offset = start;
        offset < Math.min(total, start + PAGE_SIZE * 4);
        offset += PAGE_SIZE
      ) {
        offsets.push(offset);
      }
      const pages = await Promise.all(offsets.map(fetchRecipes));
      for (const page of pages) items.push(...page.items);
    }

    const slugs = [...new Set(
      items
        .map((recipe) => typeof recipe.slug === "string" ? recipe.slug.trim() : "")
        .filter(Boolean),
    )];

    // Se a API falhou ou retornou páginas incompletas, NÃO publicamos XML parcial.
    if (slugs.length < total) {
      throw new Error(`Sitemap incompleto: ${slugs.length} de ${total} receitas`);
    }

    const locations = slugs.map((slug) => {
      const loc = escapeXml(`${SITE_URL}/receitas/${encodeURIComponent(slug)}`);
      return `  <url><loc>${loc}</loc></url>`;
    });

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...locations,
      '</urlset>',
    ].join("\n");

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=900",
      },
    });
  } catch (error) {
    console.error("Falha ao montar sitemap de receitas", error);
    return new Response("Sitemap de receitas temporariamente indisponível.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
