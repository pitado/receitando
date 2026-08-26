"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { RecipeCard } from "@/components/recipe/RecipeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { normalizeIngredientName } from "@/lib/normalize-ingredient";
import { AUTH_CHANGED_EVENT, hasAuthSessionHint } from "@/services/auth-storage";
import { listFavorites } from "@/services/favorites.service";
import { listRecipes, matchRecipesFromPantry } from "@/services/recipes.service";
import type { MatchRecipeResult, Recipe } from "@/types/recipe";

import styles from "./RecipesCatalog.module.css";

interface RecipesCatalogProps {
  initialError?: string;
  initialRecipes: Recipe[];
}

export function RecipesCatalog({ initialError = "", initialRecipes }: RecipesCatalogProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [matches, setMatches] = useState<MatchRecipeResult[] | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(initialError);
  const [isLoading, setIsLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(() => hasAuthSessionHint());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (authenticated) {
      listFavorites()
        .then((favorites) => setFavoriteIds(new Set(favorites.map((recipe) => recipe.id))))
        .catch(() => undefined);
    }

    function handleAuthChange() {
      const nextAuthenticated = hasAuthSessionHint();
      setAuthenticated(nextAuthenticated);
      if (!nextAuthenticated) {
        setFavoriteIds(new Set());
        return;
      }
      listFavorites()
        .then((favorites) => setFavoriteIds(new Set(favorites.map((recipe) => recipe.id))))
        .catch(() => undefined);
    }

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
  }, [authenticated]);

  async function retry() {
    setIsLoading(true);
    setError("");
    try {
      setRecipes(await listRecipes());
    } catch {
      setError("Não foi possível carregar o catálogo agora. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function matchWithPantry() {
    setIsLoading(true);
    setError("");
    try {
      setMatches(await matchRecipesFromPantry());
    } catch {
      setError("Não foi possível comparar sua despensa com as receitas agora.");
    } finally {
      setIsLoading(false);
    }
  }

  const normalizedQuery = normalizeIngredientName(query);
  const filteredRecipes = useMemo(() => {
    if (matches) {
      return matches.filter((recipe) =>
        !normalizedQuery ||
        normalizeIngredientName(`${recipe.title} ${recipe.description} ${recipe.mealType}`).includes(normalizedQuery),
      );
    }

    return recipes
      .filter((recipe) =>
        !normalizedQuery ||
        normalizeIngredientName(`${recipe.title} ${recipe.description} ${recipe.mealType}`).includes(normalizedQuery),
      )
      .sort((first, second) => first.title.localeCompare(second.title, "pt-BR"));
  }, [matches, normalizedQuery, recipes]);

  function updateFavorite(recipeId: string, favorite: boolean) {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (favorite) next.add(recipeId);
      else next.delete(recipeId);
      return next;
    });
  }

  if (isLoading) return <LoadingState label="Consultando a cozinha…" />;
  if (error) return <ErrorState message={error} onRetry={retry} />;

  if (recipes.length === 0 && !matches) {
    return (
      <EmptyState
        description="Quando as primeiras receitas forem cadastradas, elas aparecerão neste espaço."
        icon="R"
        title="O catálogo ainda está vazio"
      />
    );
  }

  return (
    <div className={styles.catalog}>
      <div className={styles.pantryPanel}>
        <div>
          <span className={styles.pantryEyebrow}>Sua cozinha decide</span>
          <strong>Veja primeiro o que já dá para preparar.</strong>
          <p>O Receitando compara automaticamente sua despensa com cada receita do catálogo.</p>
        </div>
        {authenticated ? (
          <button className={styles.pantryButton} onClick={() => void matchWithPantry()} type="button">
            {matches ? "Atualizar com minha despensa" : "Ver o que posso fazer com minha despensa"}
          </button>
        ) : (
          <Link className={styles.pantryButton} href="/entrar">Entrar para usar minha despensa</Link>
        )}
      </div>

      {matches ? (
        <div className={styles.matchSummary}>
          <div>
            <span>Resultado personalizado</span>
            <strong>{matches.filter((recipe) => recipe.status === "READY").length} receitas para fazer agora</strong>
          </div>
          <button onClick={() => setMatches(null)} type="button">Ver catálogo completo</button>
        </div>
      ) : null}

      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <label htmlFor="recipe-search">Buscar no catálogo</label>
          <input
            autoComplete="off"
            id="recipe-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Receita, refeição ou palavra-chave"
            type="search"
            value={query}
          />
        </div>
        <div aria-live="polite" className={styles.count}>
          <strong>{filteredRecipes.length}</strong>
          <span>{filteredRecipes.length === 1 ? "receita" : "receitas"}</span>
        </div>
      </div>

      {filteredRecipes.length > 0 ? (
        <div className={styles.grid}>
          {filteredRecipes.map((recipe) => {
            const match = "compatibility" in recipe ? recipe : null;
            const catalogRecipe = recipes.find((item) => item.id === recipe.id);
            return (
              <RecipeCard
                compatibility={match?.compatibility}
                description={recipe.description}
                difficulty={recipe.difficulty}
                externalSource={catalogRecipe?.source.externalSource}
                imageUrl={recipe.imageUrl}
                initialFavorite={favoriteIds.has(recipe.id)}
                key={recipe.id}
                mealType={recipe.mealType}
                missingIngredients={match?.missingIngredients}
                onFavoriteChange={(favorite) => updateFavorite(recipe.id, favorite)}
                prepMinutes={recipe.prepMinutes}
                recipeId={recipe.id}
                servings={recipe.servings}
                slug={recipe.slug}
                sourceName={catalogRecipe?.source.name}
                status={match?.status}
                title={recipe.title}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          description="Tente buscar com outro nome ou limpe o campo para ver todas as opções."
          icon="?"
          title="Nenhuma receita combina com a busca"
        />
      )}
    </div>
  );
}
