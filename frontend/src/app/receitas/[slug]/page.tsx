import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ErrorState } from "@/components/ui/ErrorState";
import { formatIngredientAmount, formatPrepTime } from "@/lib/format";
import { ApiError } from "@/services/api-client";
import { getRecipeBySlug } from "@/services/recipes.service";
import type { Recipe } from "@/types/recipe";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalhes da receita",
};

interface RecipeDetailPageProps {
  params: Promise<{ slug: string }>;
}

function getInstructionSteps(instructions: Recipe["instructions"]): string[] {
  const rawSteps = Array.isArray(instructions)
    ? instructions
    : instructions.split(/\r?\n/);

  return rawSteps
    .map((step) => step.trim().replace(/^\d+[.)]\s*/, ""))
    .filter(Boolean);
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const { slug } = await params;
  let recipe: Recipe | null = null;

  try {
    recipe = await getRecipeBySlug(slug);
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
  }

  if (!recipe) {
    return (
      <div className="container page-shell">
        <ErrorState message="Não foi possível abrir esta receita agora. Confira se a API está ligada e tente novamente." />
      </div>
    );
  }

  const instructionSteps = getInstructionSteps(recipe.instructions);

  return (
    <article className={`container page-shell ${styles.page}`}>
      <nav aria-label="Navegação estrutural" className={styles.breadcrumb}>
        <Link href="/receitas">Receitas</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{recipe.title}</span>
      </nav>

      <header className={styles.header}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Receita da cozinha Receitando</p>
          <h1>{recipe.title}</h1>
          <p className={styles.description}>{recipe.description}</p>
          <dl className={styles.facts}>
            <div>
              <dt>Preparo</dt>
              <dd>{formatPrepTime(recipe.prepMinutes)}</dd>
            </div>
            <div>
              <dt>Rendimento</dt>
              <dd>
                {recipe.servings} {recipe.servings === 1 ? "porção" : "porções"}
              </dd>
            </div>
          </dl>
        </div>

        <div aria-label="Espaço reservado para foto da receita" className={styles.visual}>
          <span className={styles.plate}>
            <span />
          </span>
          <p>Feita com o que já mora na sua cozinha.</p>
        </div>
      </header>

      <div className={styles.content}>
        <section aria-labelledby="ingredients-title" className={styles.ingredients}>
          <p className={styles.sectionNumber}>01</p>
          <h2 id="ingredients-title">Ingredientes</h2>
          <ul>
            {recipe.ingredients.map((item) => {
              const amount = formatIngredientAmount(item.quantity, item.unit);

              return (
                <li key={item.id ?? item.ingredient.id}>
                  <span className={styles.check} aria-hidden="true" />
                  <span>
                    <strong>{item.ingredient.name}</strong>
                    <small>
                      {amount || "a gosto"}
                      {item.optional ? " · opcional" : ""}
                    </small>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="instructions-title" className={styles.instructions}>
          <p className={styles.sectionNumber}>02</p>
          <h2 id="instructions-title">Modo de preparo</h2>
          {instructionSteps.length > 0 ? (
            <ol>
              {instructionSteps.map((step, index) => (
                <li key={`${index}-${step}`}>
                  <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.noInstructions}>
              O modo de preparo desta receita será adicionado em breve.
            </p>
          )}
        </section>
      </div>
    </article>
  );
}
