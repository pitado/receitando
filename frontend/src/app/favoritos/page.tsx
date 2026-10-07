import type { Metadata } from "next";

import { FavoritesClient } from "./FavoritesClient";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Guarde as receitas que você quer preparar novamente.",
};

export default function FavoritesPage() {
  return <FavoritesClient />;
}
