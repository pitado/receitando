import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FavoriteButton } from "@/components/recipe/FavoriteButton";
import { RecipeCommunity } from "@/components/recipe/RecipeCommunity";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatIngredientAmount, formatPrepTime } from "@/lib/format";
import { ApiError } from "@/services/api-client";
import { getRecipeBySlug } from "@/services/recipes.service";
import type { Recipe, RecipeDifficulty } from "@/types/recipe";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detalhes da receita",
};

interface RecipeDetailPageProps {
  params: Promise<{ slug: string }>;
}

const difficultyLabels: Record<RecipeDifficulty, string> = {
  FACIL: "Fácil",
  MEDIA: "Média",
  DIFICIL: "Difícil",
};

function getInstructionSteps(instructions: Recipe["instructions"]): string[] {
  const rawSteps = Array.isArray(instructions) ? instructions : instructions.split(/\r?\n/);
  return rawSteps
    .map((step) => step.trim().replace(/^\d+[.)]\s*/, ""))
    .filter(Boolean);
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const { slug } = await params;
  let recipe: Recipe | null = null;

  try {
    recipe = await getRecipeBySlug(slug);
  } catch (error: unknown) {
    if (error instanceof ApiError && error.status === 404) notFound();
  }

  if (!recipe) {
    return (
      <div className="container page-shell">
        <ErrorState message="Não foi possível abrir esta receita agora. Confira se a API está ligada e tente novamente." />
      </div>
    );
  }

  const instructionSteps = getInstructionSteps(recipe.instructions);
  const isExternalRecipe = Boolean(recipe.source.externalSource || recipe.source.url);
  const imageAttribution = recipe.image;
  const hasImageCredit = Boolean(
    recipe.imageUrl &&
      (imageAttribution?.author ||
        imageAttribution?.source ||
        imageAttribution?.license ||
        imageAttribution?.pageUrl),
  );

  return (
    <article className={`container page-shell ${styles.page}`}>
      <nav aria-label="Navegação estrutural" className={styles.breadcrumb}>
        <Link href="/receitas">Receitas</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{recipe.title}</span>
      </nav>

      <header className={styles.header}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>{recipe.mealType} · {isExternalRecipe ? "Receita de fonte externa" : difficultyLabels[recipe.difficulty]}</p>
          <div className={styles.titleRow}>
            <h1>{recipe.title}</h1>
            <FavoriteButton recipeId={recipe.id} />
          </div>
          <p className={styles.description}>{recipe.description}</p>
          <dl className={styles.facts}>
            {recipe.prepMinutes > 0 ? <div><dt>Preparo</dt><dd>{formatPrepTime(recipe.prepMinutes)}</dd></div> : null}
            {recipe.servings > 0 ? <div><dt>Rendimento</dt><dd>{recipe.servings} {recipe.servings === 1 ? "porção" : "porções"}</dd></div> : null}
            {!isExternalRecipe ? <div><dt>Dificuldade</dt><dd>{difficultyLabels[recipe.difficulty]}</dd></div> : null}
            <div>
              <dt>Origem</dt>
              <dd>
                {recipe.source.url ? (
                  <a href={recipe.source.url} rel="noreferrer" target="_blank" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: "0.2em" }}>
                    {recipe.source.name} ↗
                  </a>
                ) : recipe.source.name}
              </dd>
            </div>
          </dl>
          {recipe.source.license ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", lineHeight: 1.5, margin: 0 }}>
              Fonte atribuída a {recipe.source.author || recipe.source.name}. Conteúdo sob {recipe.source.license}
              {recipe.source.licenseUrl ? (
                <> · <a href={recipe.source.licenseUrl} rel="noreferrer" target="_blank" style={{ color: "inherit" }}>ver licença ↗</a></>
              ) : null}.
            </p>
          ) : null}
          {recipe.tags.length > 0 ? (
            <div className={styles.tags}>{recipe.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          ) : null}
        </div>

        <div aria-label={`Foto de ${recipe.title}`} className={styles.visual}>
          {recipe.imageUrl ? (
            <>
              <Image
                alt={imageAttribution?.alt || recipe.title}
                className={styles.recipeImage}
                fill
                sizes="(min-width: 800px) 45vw, 100vw"
                src={recipe.imageUrl}
              />
              {hasImageCredit ? (
                <p className={styles.imageCredit}>
                  Imagem: {imageAttribution?.author || imageAttribution?.source || "Wikimedia Commons"}
                  {imageAttribution?.pageUrl ? (
                    <> · <a href={imageAttribution.pageUrl} rel="noreferrer" target="_blank">fonte ↗</a></>
                  ) : null}
                  {imageAttribution?.license ? <> · {imageAttribution.license}</> : null}
                  {imageAttribution?.licenseUrl ? (
                    <> · <a href={imageAttribution.licenseUrl} rel="noreferrer" target="_blank">licença ↗</a></>
                  ) : null}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <span className={styles.plate}><span /></span>
              <p>Feita com o que já mora na sua cozinha.</p>
            </>
          )}
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
                <li key={item.ingredientId}>
                  <span className={styles.check} aria-hidden="true" />
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.rawText || amount || "a gosto"}{item.optional ? " · opcional" : ""}</small>
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
            <p className={styles.noInstructions}>O modo de preparo desta receita será adicionado em breve.</p>
          )}
        </section>
      </div>

      <RecipeCommunity recipeId={recipe.id} />
    </article>
  );
}
