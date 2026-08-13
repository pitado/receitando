import Link from "next/link";

import { CompatibilityBadge } from "@/components/recipe/CompatibilityBadge";
import { formatPrepTime } from "@/lib/format";

import styles from "./RecipeCard.module.css";

interface RecipeCardProps {
  compatibility?: number;
  description: string;
  missingIngredients?: string[];
  prepMinutes?: number;
  servings?: number;
  slug: string;
  title: string;
}

function buildMissingMessage(
  compatibility: number | undefined,
  missingIngredients: string[] | undefined,
): string | null {
  if (compatibility === undefined) {
    return null;
  }

  if (compatibility === 100 || !missingIngredients?.length) {
    return "Você tem tudo ✓";
  }

  const label = missingIngredients.length === 1 ? "Falta" : "Faltam";
  return `${label}: ${missingIngredients.join(", ")}`;
}

export function RecipeCard({
  compatibility,
  description,
  missingIngredients,
  prepMinutes,
  servings,
  slug,
  title,
}: RecipeCardProps) {
  const missingMessage = buildMissingMessage(compatibility, missingIngredients);

  return (
    <article className={styles.card}>
      <div aria-hidden="true" className={styles.visual}>
        <span className={styles.category}>Receita da casa</span>
      </div>

      <div className={styles.body}>
        <div className={styles.heading}>
          <h3 className={styles.title}>
            <Link className={styles.titleLink} href={`/receitas/${slug}`}>
              {title}
            </Link>
          </h3>
          {compatibility !== undefined ? (
            <CompatibilityBadge value={compatibility} />
          ) : null}
        </div>

        <p className={styles.description}>{description}</p>

        {prepMinutes !== undefined || servings !== undefined ? (
          <div className={styles.details}>
            {prepMinutes !== undefined ? (
              <span className={styles.detail}>◷ {formatPrepTime(prepMinutes)}</span>
            ) : null}
            {servings !== undefined ? (
              <span className={styles.detail}>
                ◌ {servings} {servings === 1 ? "porção" : "porções"}
              </span>
            ) : null}
          </div>
        ) : null}

        {missingMessage ? (
          <p className={styles.matchMessage}>{missingMessage}</p>
        ) : null}

        <Link className={styles.cardLink} href={`/receitas/${slug}`}>
          Ver receita <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
