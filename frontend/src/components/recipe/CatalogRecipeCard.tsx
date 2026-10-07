"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { FavoriteButton } from "@/components/recipe/FavoriteButton";
import { RecipeTransitionLink } from "@/components/recipe/RecipeTransitionLink";
import type { MatchRecipeResult, RecipeCatalogItem, RecipeDifficulty } from "@/types/recipe";

import styles from "./CatalogRecipeCard.module.css";

type CatalogRecipeCardProps = {
  authenticated: boolean;
  initialFavorite: boolean;
  match?: MatchRecipeResult;
  onFavoriteChange: (favorite: boolean) => void;
  recipe: RecipeCatalogItem;
};

const GENERIC_WIKIBOOKS_DESCRIPTION = "Receita publicada no Wikilivros em português.";

const difficultyLabels: Record<RecipeDifficulty, string> = {
  FACIL: "Fácil",
  MEDIA: "Média",
  DIFICIL: "Difícil",
};

function sourceLabel(recipe: RecipeCatalogItem) {
  if (recipe.source.externalSource === "wikibooks") return "WIKILIVROS";
  return (recipe.source.name || "COMUNIDADE").toLocaleUpperCase("pt-BR");
}

function mealIcon(mealType: string) {
  const normalized = mealType.toLocaleLowerCase("pt-BR");
  if (normalized.includes("café")) return "☕";
  if (normalized.includes("sobremesa")) return "🍰";
  if (normalized.includes("lanche")) return "🍪";
  if (normalized.includes("jantar")) return "🌙";
  if (normalized.includes("almoço")) return "🍲";
  return "🍽";
}

export function CatalogRecipeCard({
  authenticated,
  initialFavorite,
  match,
  onFavoriteChange,
  recipe,
}: CatalogRecipeCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageVisible = Boolean(recipe.imageUrl && !imageFailed);
  const compatibility = authenticated ? match?.compatibility : undefined;
  const missingCount = match?.missingIngredients.length ?? 0;
  const ready = compatibility === 100;
  const description = recipe.description.trim();
  const showDescription =
    Boolean(description) && description !== GENERIC_WIKIBOOKS_DESCRIPTION;
  const recipeHref = `/receitas/${recipe.slug}`;

  return (
    <article className={styles.card}>
      <RecipeTransitionLink href={recipeHref} title={recipe.title} />

      <div className={styles.visual}>
        {imageVisible ? (
          <Image
            alt={`Foto de ${recipe.title}`}
            className={styles.image}
            fill
            onError={() => setImageFailed(true)}
            sizes="(min-width: 1025px) 33vw, (min-width: 641px) 50vw, 100vw"
            src={recipe.imageUrl!}
          />
        ) : (
          <div className={styles.fallback} aria-hidden="true">
            <span>{mealIcon(recipe.mealType)}</span>
          </div>
        )}

        {authenticated && compatibility !== undefined ? (
          <span className={`${styles.compatibilityBadge} ${ready ? styles.readyBadge : ""}`}>
            {ready
              ? "Dá pra fazer"
              : `${compatibility}% · ${missingCount === 1 ? "falta 1" : `faltam ${missingCount}`}`}
          </span>
        ) : null}

        <span className={styles.mealBadge}>{recipe.mealType || "Receita"}</span>

        <div className={styles.favoriteAction}>
          <FavoriteButton
            initialFavorite={initialFavorite}
            label={false}
            onChange={onFavoriteChange}
            recipeId={recipe.id}
            syncFavorite={false}
          />
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.source}>{sourceLabel(recipe)}</p>
        <h3>{recipe.title}</h3>

        <div className={styles.meta}>
          <span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 7v5l3 2" />
            </svg>
            {recipe.prepMinutes > 0 ? `${recipe.prepMinutes} min` : "Tempo livre"}
          </span>
          <span>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M7 13a5 5 0 0 1 10 0v1H7v-1Z" />
              <path d="M5 14h14v3H5zM9 17v3m6-3v3" />
            </svg>
            {difficultyLabels[recipe.difficulty]}
          </span>
        </div>

        {showDescription ? <p className={styles.description}>{description}</p> : null}

        {authenticated && compatibility !== undefined ? (
          <div
            aria-label={`${compatibility}% compatível com sua despensa`}
            className={`${styles.compatibilityBar} ${ready ? styles.compatibilityBarReady : ""}`}
          >
            <span style={{ width: `${Math.max(0, Math.min(100, compatibility))}%` }} />
          </div>
        ) : null}

        <div className={styles.footer}>
          <Link href={recipeHref}>Ver receita</Link>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </article>
  );
}
