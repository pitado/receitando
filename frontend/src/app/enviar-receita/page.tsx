import type { Metadata } from "next";

import { RecipeSubmissionForm } from "@/components/recipe/RecipeSubmissionForm";
import { SectionTitle } from "@/components/ui/SectionTitle";

import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Enviar receita",
  description: "Compartilhe uma receita com a comunidade do Receitando.",
};

export default function SubmitRecipePage() {
  return (
    <div className={`container page-shell ${styles.page}`}>
      <div className={styles.intro}>
        <SectionTitle
          as="h1"
          eyebrow="Receitas da comunidade"
          description="Tem uma receita que sempre dá certo na sua casa? Compartilhe com a gente. Depois de uma revisão, ela poderá entrar no catálogo do Receitando."
        >
          Coloque sua receita na mesa
        </SectionTitle>

        <div className={styles.tips}>
          <span>✓ ingredientes claros</span>
          <span>✓ passo a passo completo</span>
          <span>✓ foto do prato, se tiver</span>
        </div>
      </div>

      <RecipeSubmissionForm />
    </div>
  );
}
