import type { Metadata } from "next";

import { SectionTitle } from "@/components/ui/SectionTitle";

import { PantryClient } from "./PantryClient";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Despensa",
  description: "Guarde os ingredientes que você possui em casa.",
};

export default function PantryPage() {
  return (
    <div className={`container page-shell ${styles.page}`}>
      <SectionTitle
        as="h1"
        description="Guarde aqui o que você tem em casa. A despensa fica ligada à sua conta e será usada para encontrar receitas que combinam com seus ingredientes."
        eyebrow="Sua cozinha, de verdade"
      >
        Tudo o que já mora na sua cozinha
      </SectionTitle>

      <PantryClient />
    </div>
  );
}
