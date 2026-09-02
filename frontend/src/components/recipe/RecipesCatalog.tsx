"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { RecipeCard } from "@/components/recipe/RecipeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { normalizeIngredientName } from "@/lib/normalize-ingredient";
import { AUTH_CHANGED_EVENT, hasAuthSessionHint } from "@/services/auth-storage";
import { listFavorites } from "@/services/favorites.service";
import { listRecipes, matchRecipesFromPantry } from "@/services/recipes.service";
import type {
  MatchRecipeResult,
  RecipeCatalogItem,
  RecipeCatalogResponse,
} from "@/types/recipe";

import styles from "./RecipesCatalog.module.css";

interface RecipesCatalogProps {
  initialCatalog: RecipeCatalogResponse;
  initialError?: string;
}

const PAGE_SIZE = 36;
const SEARCH_DELAY_MS = 300;

function mergeRecipes(
  current: RecipeCatalogItem[],
  incoming: RecipeCatalogItem[],
): RecipeCatalogItem[] {
  const byId = new Map(current.map((recipe) => [recipe.id, recipe]));
  for (const recipe of incoming) byId.set(recipe.id, recipe);
  return [...byId.values()];
}

export function RecipesCatalog({ initialCatalog, initialError = "" }: RecipesCatalogProps) {
  const [recipes, setRecipes] = useState(initialCatalog.items);
  const [matches, setMatches] = useState<MatchRecipeResult[] | null>(null);
  const [query, setQuery] = useState(initialCatalog.filters.query);
  const [error, setError] = useState(initialError);
  const [paginationError, setPaginationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialCatalog.pagination.hasMore);
  const [total, setTotal] = useState(initialCatalog.pagination.total);
  const [authenticated, setAuthenticated] = useState(() => hasAuthSessionHint());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const lastRequestedQuery = useRef(initialCatalog.filters.query);

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

  useEffect(() => {
    if (matches) return;

    const searchQuery = query.trim();
    if (searchQuery === lastRequestedQuery.current) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      setPaginationError("");

      listRecipes({
        limit: PAGE_SIZE,
        offset: 0,
        query: searchQuery || undefined,
        signal: controller.signal,
      })
        .then((nextCatalog) => {
          lastRequestedQuery.current = searchQuery;
          setRecipes(nextCatalog.items);
          setHasMore(nextCatalog.pagination.hasMore);
          setTotal(nextCatalog.pagination.total);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setError("Não foi possível buscar no catálogo agora. Tente novamente.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, SEARCH_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [matches, query]);

  async function retry() {
    const searchQuery = query.trim();
    setIsLoading(true);
    setError("");
    try {
      const nextCatalog = await listRecipes({
        limit: PAGE_SIZE,
        offset: 0,
        query: searchQuery || undefined,
      });
      lastRequestedQuery.current = searchQuery;
      setRecipes(nextCatalog.items);
      setHasMore(nextCatalog.pagination.hasMore);
      setTotal(nextCatalog.pagination.total);
    } catch {
      setError("Não foi possível carregar o catálogo agora. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMore() {
    if (isLoadingMore || !hasMore || matches) return;

    setIsLoadingMore(true);
    setPaginationError("");
    try {
      const nextCatalog = await listRecipes({
        limit: PAGE_SIZE,
        offset: recipes.length,
        query: query.trim() || undefined,
      });
      setRecipes((current) => mergeRecipes(current, nextCatalog.items));
      setHasMore(nextCatalog.pagination.hasMore);
      setTotal(nextCatalog.pagination.total);
    } catch {
      setPaginationError("Não foi possível carregar mais receitas agora.");
    } finally {
      setIsLoadingMore(false);
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
    if (!matches) return recipes;

    return matches.filter((recipe) =>
      !normalizedQuery ||
      normalizeIngredientName(`${recipe.title} ${recipe.description} ${recipe.mealType}`).includes(normalizedQuery),
    );
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

  if (recipes.length === 0 && !matches && !query) {
    return (
      <EmptyState
        description="Quando as primeiras receitas forem cadastradas, elas aparecerão neste espaço."
        icon="R"
        title="O catálogo ainda está vazio"
      />
    );
  }

  const countValue = matches ? filteredRecipes.length : total;
  const countLabel = query.trim() ? "resultados" : countValue === 1 ? "receita" : "receitas";

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
          <label htmlFor="recipe-search">Buscar receitas</label>
          <div className={styles.searchControl}>
            <span aria-hidden="true" className={styles.searchIcon}>⌕</span>
            <input
              autoComplete="off"
              id="recipe-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome, refeição ou palavra-chave"
              type="search"
              value={query}
            />
            {query ? (
              <button
                aria-label="Limpar busca"
                className={styles.clearSearch}
                onClick={() => setQuery("")}
                type="button"
              >
                ×
              </button>
            ) : null}
          </div>
          <span className={styles.searchHint}>
            {isSearching ? "Buscando em todo o catálogo…" : "A busca consulta o catálogo completo, não só os cards carregados."}
          </span>
        </div>
        <div aria-live="polite" className={styles.count}>
          <strong>{countValue}</strong>
          <span>{countLabel}</span>
        </div>
      </div>

      {filteredRecipes.length > 0 ? (
        <>
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

          {!matches && hasMore ? (
            <div className={styles.pagination}>
              <button disabled={isLoadingMore || isSearching} onClick={() => void loadMore()} type="button">
                {isLoadingMore ? "Carregando…" : "Carregar mais receitas"}
              </button>
              <span>Você está vendo {recipes.length} de {total} receitas.</span>
              {paginationError ? <p role="alert">{paginationError}</p> : null}
            </div>
          ) : null}
        </>
      ) : isSearching ? (
        <LoadingState label="Buscando receitas…" />
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
