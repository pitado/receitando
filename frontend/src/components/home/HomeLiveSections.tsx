"use client";

import Image from "next/image";
import Link from "next/link";

import { FoodAvatar } from "@/components/profile/FoodAvatar";
import { FavoriteButton } from "@/components/recipe/FavoriteButton";
import type { AuthUser } from "@/services/auth.service";
import type { HomeFeed, HomePopularRecipe } from "@/services/home.service";
import type { MatchRecipeResult } from "@/types/recipe";

import styles from "./HomeLiveSections.module.css";

type HomeLiveSectionsProps = {
  feed: HomeFeed | null;
  matches: MatchRecipeResult[];
  pantryCount: number;
  user: AuthUser | null;
  onAddIngredient: (ingredient: string) => void;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

function statusLabel(recipe: MatchRecipeResult) {
  if (recipe.status === "READY") return "Pronta pra fazer";
  if (recipe.missingIngredients.length === 1) return "Falta 1";
  if (recipe.missingIngredients.length > 1) return "Faltam " + recipe.missingIngredients.length;
  return "Explore";
}

function statusClass(recipe: MatchRecipeResult) {
  if (recipe.status === "READY") return styles.ready;
  if (recipe.missingIngredients.length === 1) return styles.missingOne;
  return styles.missingMany;
}

function RecipeThumbnail({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl: string | null;
}) {
  if (imageUrl) {
    return (
      <Image
        alt={"Foto de " + title}
        fill
        sizes="96px"
        src={imageUrl}
      />
    );
  }

  return <span className={styles.thumbnailFallback}>{title.slice(0, 1).toLocaleUpperCase("pt-BR")}</span>;
}

function MatchRow({
  recipe,
  onAddIngredient,
}: {
  recipe: MatchRecipeResult;
  onAddIngredient: (ingredient: string) => void;
}) {
  return (
    <div className={styles.recipeRow}>
      <Link className={styles.thumbnail} href={"/receitas/" + recipe.slug}>
        <RecipeThumbnail imageUrl={recipe.imageUrl} title={recipe.title} />
      </Link>

      <div className={styles.recipeInfo}>
        <Link className={styles.recipeTitle} href={"/receitas/" + recipe.slug}>
          {recipe.title}
        </Link>
        <span className={styles.recipeMeta}>{recipe.mealType || "Receita"}, {recipe.prepMinutes} min</span>
      </div>

      <div className={styles.ingredients}>
        {recipe.foundIngredients.slice(0, 4).map((ingredient) => (
          <span className={styles.havePill} key={ingredient.id}>{ingredient.name}</span>
        ))}
        {recipe.missingIngredients.slice(0, 3).map((ingredient) => (
          <button className={styles.missingPill} key={ingredient.id} onClick={() => onAddIngredient(ingredient.name)} type="button">
            + {ingredient.name}
          </button>
        ))}
      </div>

      <span className={[styles.status, statusClass(recipe)].join(" ")}>{statusLabel(recipe)}</span>

      <span className={styles.favoriteButton}>
        <FavoriteButton label={false} recipeId={recipe.id} />
      </span>
    </div>
  );
}

function PopularRow({ recipe }: { recipe: HomePopularRecipe }) {
  return (
    <div className={styles.recipeRow}>
      <Link className={styles.thumbnail} href={"/receitas/" + recipe.slug}>
        <RecipeThumbnail imageUrl={recipe.imageUrl} title={recipe.title} />
      </Link>

      <div className={styles.recipeInfo}>
        <Link className={styles.recipeTitle} href={"/receitas/" + recipe.slug}>{recipe.title}</Link>
        <span className={styles.recipeMeta}>{recipe.mealType || "Receita"}, {recipe.prepMinutes} min</span>
      </div>

      <div className={styles.ingredients}>
        <span className={styles.havePill}>comece com sua bancada</span>
      </div>

      <span className={styles.status}>{recipe.likes} gostaram</span>

      <span className={styles.favoriteButton}>
        <FavoriteButton label={false} recipeId={recipe.id} />
      </span>
    </div>
  );
}

export function HomeLiveSections({
  feed,
  matches,
  pantryCount,
  user,
  onAddIngredient,
}: HomeLiveSectionsProps) {
  const visibleMatches = matches.slice(0, 6);
  const recentComments = feed?.recentComments.slice(0, 3) ?? [];
  const recipeCount = feed?.totals.recipes ?? 0;

  return (
    <>
      <section className={styles.combinationsSection} id="combinacoes">
        <div className="home-container">
          <div className={styles.sectionHeading}>
            <h2>Do que já dá pra fazer ao que falta pouco</h2>
            <p>A lista se reorganiza conforme sua bancada muda. Toque num ingrediente que falta para adicioná-lo.</p>
          </div>

          <div className={styles.recipeList}>
            {visibleMatches.length > 0
              ? visibleMatches.map((recipe) => (
                  <MatchRow key={recipe.id} onAddIngredient={onAddIngredient} recipe={recipe} />
                ))
              : feed?.popular.slice(0, 6).map((recipe) => <PopularRow key={recipe.id} recipe={recipe} />)}
          </div>

          <Link className={styles.outlineButton} href="/receitas">
            Ver as {recipeCount} receitas
          </Link>
        </div>
      </section>

      <section className={styles.stepsSection}>
        <div className="home-container">
          <div className={styles.stepGrid}>
            <article>
              <strong>01</strong>
              <h3>Conte o que tem.</h3>
              <p>Digite ou escolha. Três ingredientes já bastam para começar.</p>
            </article>
            <article>
              <strong>02</strong>
              <h3>Compare as opções.</h3>
              <p>O Receitando mostra o que já combina e o que ainda está faltando.</p>
            </article>
            <article>
              <strong>03</strong>
              <h3>Escolha e cozinhe.</h3>
              <p>Menos lista de compras, mais ideia para aproveitar o que já mora na sua cozinha.</p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.communitySection}>
        <div className="home-container">
          <div className={styles.communityHeading}>
            <h2>Quem fez, conta</h2>
            <Link className={styles.outlineButtonSmall} href="/receitas">Ver comentários</Link>
          </div>

          {recentComments.length > 0 ? (
            <div className={styles.commentGrid}>
              {recentComments.map((comment) => (
                <Link className={styles.comment} href={"/receitas/" + comment.recipeSlug} key={comment.id}>
                  <blockquote>“{comment.body}”</blockquote>
                  <div className={styles.commentByline}>
                    <FoodAvatar
                      avatarKey={comment.avatarKey}
                      className={styles.avatar}
                      label={"Avatar de " + comment.authorName}
                    />
                    <span><strong>{comment.authorName}</strong> em {comment.recipeTitle}</span>
                    <small>{formatDate(comment.createdAt)}</small>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.emptyComments}>Abra uma receita e deixe um comentário para aparecer aqui.</p>
          )}
        </div>
      </section>

      <section className={styles.submitSection}>
        <div className="home-container">
          <div className={styles.submitCard}>
            <div>
              <h2>Tem uma receita que sempre dá certo na sua casa?</h2>
              <p>Mande pra gente. Depois de uma revisão, ela entra no catálogo e recebe comentários e avaliações da comunidade.</p>
            </div>
            <Link className={styles.yellowButton} href="/enviar-receita">Enviar minha receita</Link>
          </div>

          {user ? (
            <p className={styles.pantryNote}>
              Sua despensa tem {pantryCount} {pantryCount === 1 ? "ingrediente" : "ingredientes"} e está sendo usada nesta bancada.
            </p>
          ) : null}

        </div>
      </section>
    </>
  );
}
