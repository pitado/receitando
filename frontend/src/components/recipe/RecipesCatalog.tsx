"use client";

import { useState } from "react";

import { RecipeCard } from "@/components/recipe/RecipeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { normalizeIngredientName } from "@/lib/normalize-ingredient";
import { listRecipes } from "@/services/recipes.service";
import type { Recipe } from "@/types/recipe";

import styles from "./RecipesCatalog.module.css";

interface RecipesCatalogProps {
  initialError?: string;
  initialRecipes: Recipe[];
}

export function RecipesCatalog({
  initialError = "",
  initialRecipes,
}: RecipesCatalogProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(initialError);
  const [isLoading, setIsLoading] = useState(false);

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

  if (isLoading) {
    return <LoadingState label="Buscando receitas na cozinha…" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  if (recipes.length === 0) {
    return (
      <EmptyState
        description="Quando as primeiras receitas forem cadastradas, elas aparecerão neste espaço."
        icon="R"
        title="O catálogo ainda está vazio"
      />
    );
  }

  const normalizedQuery = normalizeIngredientName(query);
  const filteredRecipes = recipes
    .filter((recipe) => {
      if (!normalizedQuery) {
        return true;
      }

      return normalizeIngredientName(
        `${recipe.title} ${recipe.description}`,
      ).includes(normalizedQuery);
    })
    .sort((first, second) => first.title.localeCompare(second.title, "pt-BR"));

  return (
    <div className={styles.catalog}>
      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <label htmlFor="recipe-search">Buscar no catálogo</label>
          <input
            autoComplete="off"
            id="recipe-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Digite o nome de uma receita"
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
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              description={recipe.description}
              key={recipe.id}
              prepMinutes={recipe.prepMinutes}
              servings={recipe.servings}
              slug={recipe.slug}
              title={recipe.title}
            />
          ))}
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
