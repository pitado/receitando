import type { Metadata } from "next";

import { SectionTitle } from "@/components/ui/SectionTitle";

import { FavoritesClient } from "./FavoritesClient";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Guarde as receitas que você quer preparar novamente.",
};

export default function FavoritesPage() {
  return (
    <div className={`container page-shell ${styles.page}`}>
      <SectionTitle
        as="h1"
        description="Seu caderno pessoal com as receitas que você marcou para fazer de novo."
        eyebrow="Seu caderno"
      >
        Receitas favoritas
      </SectionTitle>
      <FavoritesClient />
    </div>
  );
}
