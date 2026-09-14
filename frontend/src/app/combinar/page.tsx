import { IngredientMatcher } from "@/components/ingredient/IngredientMatcher";

import styles from "./page.module.css";

type CombinePageProps = {
  searchParams: Promise<{
    ingredientes?: string | string[];
  }>;
};

function parseIngredients(value?: string | string[]): string[] {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return [];

  return rawValue
    .split(",")
    .map((ingredient) => ingredient.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export default async function CombinePage({ searchParams }: CombinePageProps) {
  const params = await searchParams;
  const initialIngredients = parseIngredients(params.ingredientes);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`container ${styles.heroContainer}`}>
          <p className={styles.eyebrow}>Combinações da sua cozinha</p>
          <h1>O que dá para fazer?</h1>
          <p className={styles.description}>
            Conte o que tem em casa e descubra as receitas que mais combinam com a sua cozinha agora.
          </p>
          <details className={styles.explainer}>
            <summary>Como calculamos a compatibilidade?</summary>
            <p>
              Comparamos os ingredientes obrigatórios da receita com a sua lista. Itens básicos como água, sal, pimenta e óleo não reduzem a pontuação quando estão marcados como básicos no catálogo. Quantidades e unidades ainda não entram no cálculo.
            </p>
          </details>
        </div>
      </section>

      <section className={styles.matcherSection}>
        <div className={`container ${styles.matcherContainer}`}>
          <IngredientMatcher initialIngredients={initialIngredients} />
        </div>
      </section>
    </div>
  );
}
