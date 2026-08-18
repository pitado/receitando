import Link from "next/link";

import { CompatibilityBadge } from "@/components/recipe/CompatibilityBadge";
import { FavoriteButton } from "@/components/recipe/FavoriteButton";
import { formatPrepTime } from "@/lib/format";
import type {
  MatchIngredient,
  RecipeDifficulty,
  RecipeMatchStatus,
} from "@/types/recipe";

import styles from "./RecipeCard.module.css";

interface RecipeCardProps {
  compatibility?: number;
  description: string;
  difficulty?: RecipeDifficulty;
  initialFavorite?: boolean;
  mealType?: string;
  missingIngredients?: MatchIngredient[];
  onFavoriteChange?: (favorite: boolean) => void;
  prepMinutes?: number;
  recipeId: string;
  servings?: number;
  slug: string;
  status?: RecipeMatchStatus;
  title: string;
}

const statusLabels: Record<RecipeMatchStatus, string> = {
  READY: "Dá para fazer agora",
  ALMOST_READY: "Falta pouca coisa",
  NEAR: "Quase lá",
  EXPLORE: "Para explorar",
};

const difficultyLabels: Record<RecipeDifficulty, string> = {
  FACIL: "Fácil",
  MEDIA: "Média",
  DIFICIL: "Difícil",
};

function buildMissingMessage(
  compatibility: number | undefined,
  missingIngredients: MatchIngredient[] | undefined,
): string | null {
  if (compatibility === undefined) return null;
  if (compatibility === 100 || !missingIngredients?.length) return "Você tem tudo ✓";

  const label = missingIngredients.length === 1 ? "Falta" : "Faltam";
  return `${label}: ${missingIngredients.map((item) => item.name).join(", ")}`;
}

export function RecipeCard({
  compatibility,
  description,
  difficulty,
  initialFavorite = false,
  mealType,
  missingIngredients,
  onFavoriteChange,
  prepMinutes,
  recipeId,
  servings,
  slug,
  status,
  title,
}: RecipeCardProps) {
  const missingMessage = buildMissingMessage(compatibility, missingIngredients);

  return (
    <article className={styles.card}>
      <div aria-hidden="true" className={styles.visual}>
        <span className={styles.category}>{mealType || "Receita da casa"}</span>
        {status ? <span className={styles.status}>{statusLabels[status]}</span> : null}
      </div>

      <div className={styles.body}>
        <div className={styles.heading}>
          <h3 className={styles.title}>
            <Link className={styles.titleLink} href={`/receitas/${slug}`}>
              {title}
            </Link>
          </h3>
          {compatibility !== undefined ? <CompatibilityBadge value={compatibility} /> : null}
        </div>

        <p className={styles.description}>{description}</p>

        {prepMinutes !== undefined || servings !== undefined || difficulty ? (
          <div className={styles.details}>
            {prepMinutes !== undefined ? (
              <span className={styles.detail}>◷ {formatPrepTime(prepMinutes)}</span>
            ) : null}
            {servings !== undefined ? (
              <span className={styles.detail}>
                ◌ {servings} {servings === 1 ? "porção" : "porções"}
              </span>
            ) : null}
            {difficulty ? <span className={styles.detail}>◇ {difficultyLabels[difficulty]}</span> : null}
          </div>
        ) : null}

        {missingMessage ? <p className={styles.matchMessage}>{missingMessage}</p> : null}

        <div className={styles.actions}>
          <Link className={styles.cardLink} href={`/receitas/${slug}`}>
            Ver receita <span aria-hidden="true">→</span>
          </Link>
          <FavoriteButton
            initialFavorite={initialFavorite}
            key={`${recipeId}-${initialFavorite ? "saved" : "unsaved"}`}
            label={false}
            onChange={onFavoriteChange}
            recipeId={recipeId}
            syncFavorite={false}
          />
        </div>
      </div>
    </article>
  );
}
