import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Receitando",
    short_name: "Receitando",
    description: "Receitas possíveis com os ingredientes que você já tem em casa.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f5ef",
    theme_color: "#6f8167",
    lang: "pt-BR",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
