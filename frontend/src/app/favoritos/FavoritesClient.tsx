"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { RecipeCard } from "@/components/recipe/RecipeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { AUTH_CHANGED_EVENT, getAuthToken } from "@/services/auth-storage";
import { listFavorites } from "@/services/favorites.service";
import type { Recipe } from "@/types/recipe";

import styles from "./page.module.css";

export function FavoritesClient() {
  const [authenticated, setAuthenticated] = useState(() => Boolean(getAuthToken()));
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(() => Boolean(getAuthToken()));
  const [error, setError] = useState("");

  useEffect(() => {
    if (authenticated) {
      listFavorites()
        .then((favorites) => setRecipes(favorites))
        .catch(() => setError("Não foi possível carregar seus favoritos agora."))
        .finally(() => setLoading(false));
    }

    function handleAuthChange() {
      const nextAuthenticated = Boolean(getAuthToken());
      setAuthenticated(nextAuthenticated);
      if (!nextAuthenticated) {
        setRecipes([]);
        setLoading(false);
        setError("");
        return;
      }
      setLoading(true);
      listFavorites()
        .then((favorites) => setRecipes(favorites))
        .catch(() => setError("Não foi possível carregar seus favoritos agora."))
        .finally(() => setLoading(false));
    }

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
  }, [authenticated]);

  function removeFromView(recipeId: string, favorite: boolean) {
    if (!favorite) setRecipes((current) => current.filter((recipe) => recipe.id !== recipeId));
  }

  if (!authenticated) {
    return (
      <EmptyState
        action={<Link className={styles.action} href="/entrar">Entrar na minha conta</Link>}
        description="Seus favoritos ficam vinculados à sua conta para você encontrar tudo de novo em qualquer acesso."
        icon="♡"
        title="Entre para ver seus favoritos"
      />
    );
  }

  if (loading) return <LoadingState label="Abrindo seu caderno de receitas…" />;
  if (error) return <ErrorState message={error} />;

  if (recipes.length === 0) {
    return (
      <EmptyState
        action={<Link className={styles.action} href="/receitas">Explorar receitas</Link>}
        description="Use o coração nos cards ou na página da receita para guardar o que você quer preparar novamente."
        icon="♡"
        title="Você ainda não salvou nenhuma receita"
      />
    );
  }

  return (
    <div className={styles.grid}>
      {recipes.map((recipe) => (
        <RecipeCard
          description={recipe.description}
          difficulty={recipe.difficulty}
          imageUrl={recipe.imageUrl}
          initialFavorite
          key={recipe.id}
          mealType={recipe.mealType}
          onFavoriteChange={(favorite) => removeFromView(recipe.id, favorite)}
          prepMinutes={recipe.prepMinutes}
          recipeId={recipe.id}
          servings={recipe.servings}
          slug={recipe.slug}
          title={recipe.title}
        />
      ))}
    </div>
  );
}
