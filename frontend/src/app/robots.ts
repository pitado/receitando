import type { MetadataRoute } from "next";

const BASE_URL = "https://receitando.miguelpita.com.br";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/cadastro",
          "/conta/",
          "/despensa/",
          "/entrar",
          "/favoritos/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
