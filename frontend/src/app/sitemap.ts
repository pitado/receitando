import type { MetadataRoute } from "next";

import { listRecipes } from "@/services/recipes.service";

const BASE_URL = "https://receitando.miguelpita.com.br";
const PAGE_SIZE = 100;

async function getRecipeEntries(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  let offset = 0;

  try {
    while (true) {
      const catalog = await listRecipes({
        limit: PAGE_SIZE,
        offset,
        sort: "title",
      });

      entries.push(
        ...catalog.items.map((recipe) => ({
          url: `${BASE_URL}/receitas/${encodeURIComponent(recipe.slug)}`,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        })),
      );

      if (!catalog.pagination.hasMore || catalog.items.length === 0) {
        break;
      }

      offset += catalog.items.length;

      if (offset >= catalog.pagination.total) {
        break;
      }
    }
  } catch {
    // Mantém o sitemap disponível mesmo se a API estiver temporariamente indisponível.
    return [];
  }

  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const recipeEntries = await getRecipeEntries();

  return [
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/receitas`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/combinar`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...recipeEntries,
  ];
}
