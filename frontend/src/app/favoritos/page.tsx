import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";
import { SectionTitle } from "@/components/ui/SectionTitle";

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
        description="Seu caderno pessoal de receitas preferidas ficará organizado aqui quando a conta de usuário estiver disponível."
        eyebrow="Seu caderno"
      >
        Receitas para fazer de novo
      </SectionTitle>

      <EmptyState
        action={
          <Link className={styles.action} href="/receitas">
            Explorar receitas
          </Link>
        }
        description="Explore o catálogo e, em breve, você poderá guardar aqui tudo o que quiser cozinhar novamente."
        icon="♡"
        title="Você ainda não salvou nenhuma receita"
      />
    </div>
  );
}
