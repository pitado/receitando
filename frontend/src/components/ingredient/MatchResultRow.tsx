import Image from "next/image";
import Link from "next/link";

import type { MatchRecipeResult, RecipeDifficulty } from "@/types/recipe";

import styles from "./MatchResultRow.module.css";

type MatchResultRowProps = {
  recipe: MatchRecipeResult;
  urgentIngredientNames?: string[];
};

const difficultyLabels: Record<RecipeDifficulty, string> = {
  FACIL: "Fácil",
  MEDIA: "Média",
  DIFICIL: "Difícil",
};

function joinNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

export function MatchResultRow({
  recipe,
  urgentIngredientNames = [],
}: MatchResultRowProps) {
  const ready = recipe.compatibility === 100;
  const missingCount = recipe.missingIngredients.length;
  const meta = [
    recipe.mealType || "Receita",
    `${recipe.prepMinutes} min`,
    difficultyLabels[recipe.difficulty],
  ].join(" · ");

  return (
    <article className={styles.row}>
      <div className={styles.thumbnail}>
        {recipe.imageUrl ? (
          <Image
            alt={`Foto de ${recipe.title}`}
            className={styles.image}
            fill
            sizes="88px"
            src={recipe.imageUrl}
          />
        ) : (
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M6 3v7m3-7v7M6 7h3m8-4v18m0-11c2.5 0 4-1.6 4-3.7S19.5 3 17 3" />
            <path d="M7.5 10v11M17 10v11" />
          </svg>
        )}
      </div>

      <div className={styles.compatibility}>
        <strong className={ready ? styles.total : undefined}>
          {recipe.compatibility}%
        </strong>
        <span className={styles.progress} aria-hidden="true">
          <span style={{ width: `${Math.max(0, Math.min(100, recipe.compatibility))}%` }} />
        </span>
        <small>compatível</small>
      </div>

      <div className={styles.content}>
        <h3>{recipe.title}</h3>
        <p className={styles.meta}>{meta}</p>
        <div className={styles.tags} aria-label="Compatibilidade de ingredientes">
          {recipe.foundIngredients.map((ingredient) => (
            <span className={styles.found} key={`found-${ingredient.id}`}>
              {ingredient.name}
            </span>
          ))}
          {recipe.missingIngredients.map((ingredient) => (
            <span className={styles.missing} key={`missing-${ingredient.id}`}>
              + {ingredient.name}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <span className={ready ? styles.readyBadge : styles.missingBadge}>
          {ready
            ? "Dá pra fazer"
            : missingCount === 1
              ? "Falta 1"
              : `Faltam ${missingCount}`}
        </span>

        {urgentIngredientNames.length > 0 ? (
          <p className={styles.urgency}>
            🕒 usa {joinNames(urgentIngredientNames)}, que{" "}
            {urgentIngredientNames.length === 1 ? "vence" : "vencem"} logo
          </p>
        ) : null}

        <Link href={`/receitas/${recipe.slug}`}>Ver receita</Link>
      </div>
    </article>
  );
}
