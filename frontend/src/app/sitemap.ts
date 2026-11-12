import type { MetadataRoute } from "next";

const BASE_URL = "https://receitando.miguelpita.com.br";

// Páginas institucionais e de descoberta.
// As receitas individuais estão no sitemap dinâmico /sitemap-receitas.xml.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/receitas`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/combinar`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/sobre`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
