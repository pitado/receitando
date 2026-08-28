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
  externalSource?: string | null;
  imageUrl?: string | null;
  initialFavorite?: boolean;
  mealType?: string;
  missingIngredients?: MatchIngredient[];
  onFavoriteChange?: (favorite: boolean) => void;
  prepMinutes?: number;
  recipeId: string;
  servings?: number;
  slug: string;
  sourceName?: string;
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
  externalSource,
  imageUrl,
  initialFavorite = false,
  mealType,
  missingIngredients,
  onFavoriteChange,
  prepMinutes,
  recipeId,
  servings,
  slug,
  sourceName,
  status,
  title,
}: RecipeCardProps) {
  const missingMessage = buildMissingMessage(compatibility, missingIngredients);
  const imageStyle = imageUrl
    ? { backgroundImage: `linear-gradient(180deg, rgba(42, 22, 8, 0.02), rgba(42, 22, 8, 0.32)), url("${imageUrl.replaceAll('"', '%22')}")` }
    : undefined;
  const hasPrepTime = typeof prepMinutes === "number" && prepMinutes > 0;
  const hasServings = typeof servings === "number" && servings > 0;
  const recipeHref = `/receitas/${slug}`;

  return (
    <article className={styles.card}>
      <Link
        aria-label={`Abrir receita ${title}`}
        className={styles.cardOverlay}
        href={recipeHref}
      />

      <div
        aria-label={imageUrl ? `Foto de ${title}` : undefined}
        aria-hidden={imageUrl ? undefined : true}
        className={`${styles.visual} ${imageUrl ? styles.visualWithImage : ""}`}
        role={imageUrl ? "img" : undefined}
        style={imageStyle}
      >
        <span className={styles.category}>{mealType || "Receita"}</span>
        {status ? <span className={styles.status}>{statusLabels[status]}</span> : null}
      </div>

      <div className={styles.body}>
        <div className={styles.heading}>
          <h3 className={styles.title}>{title}</h3>
          {compatibility !== undefined ? <CompatibilityBadge value={compatibility} /> : null}
        </div>

        <p className={styles.description}>{description}</p>

        {hasPrepTime || hasServings || (difficulty && !externalSource) || (externalSource && sourceName) ? (
          <div className={styles.details}>
            {hasPrepTime ? <span className={styles.detail}>◷ {formatPrepTime(prepMinutes)}</span> : null}
            {hasServings ? (
              <span className={styles.detail}>
                ◌ {servings} {servings === 1 ? "porção" : "porções"}
              </span>
            ) : null}
            {difficulty && !externalSource ? <span className={styles.detail}>◇ {difficultyLabels[difficulty]}</span> : null}
            {externalSource && sourceName ? <span className={styles.detail}>Fonte: {sourceName}</span> : null}
          </div>
        ) : null}

        {missingMessage ? <p className={styles.matchMessage}>{missingMessage}</p> : null}

        <div className={styles.actions}>
          <span className={styles.cardLink}>
            Ver receita <span aria-hidden="true">→</span>
          </span>
          <div className={styles.favoriteAction}>
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
      </div>
    </article>
  );
}
