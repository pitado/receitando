"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { CatalogFilters } from "@/components/recipe/CatalogFilters";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { normalizeIngredientName } from "@/lib/normalize-ingredient";
import { AUTH_CHANGED_EVENT, hasAuthSessionHint } from "@/services/auth-storage";
import { listFavorites } from "@/services/favorites.service";
import { listRecipes, matchRecipesFromPantry } from "@/services/recipes.service";
import type { MatchRecipeResult, RecipeCatalogItem, RecipeCatalogResponse, RecipeCatalogSort, RecipeDifficulty } from "@/types/recipe";

import styles from "./RecipesCatalog.module.css";

interface RecipesCatalogProps { initialCatalog: RecipeCatalogResponse; initialError?: string; }
const PAGE_SIZE = 36;
const SEARCH_DELAY_MS = 300;

function mergeRecipes(current: RecipeCatalogItem[], incoming: RecipeCatalogItem[]): RecipeCatalogItem[] {
  const byId = new Map(current.map((recipe) => [recipe.id, recipe]));
  for (const recipe of incoming) byId.set(recipe.id, recipe);
  return [...byId.values()];
}

export function RecipesCatalog({ initialCatalog, initialError = "" }: RecipesCatalogProps) {
  const initialMaxPrepMinutes = initialCatalog.filters.maxPrepMinutes ? String(initialCatalog.filters.maxPrepMinutes) : "";
  const initialSignature = [initialCatalog.filters.query, initialCatalog.filters.source, initialCatalog.filters.mealType, initialCatalog.filters.difficulty, initialMaxPrepMinutes, initialCatalog.filters.sort].join("|");
  const [recipes, setRecipes] = useState(initialCatalog.items);
  const [matches, setMatches] = useState<MatchRecipeResult[] | null>(null);
  const [query, setQuery] = useState(initialCatalog.filters.query);
  const [source, setSource] = useState(initialCatalog.filters.source);
  const [mealType, setMealType] = useState(initialCatalog.filters.mealType);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty | "">(initialCatalog.filters.difficulty);
  const [maxPrepMinutes, setMaxPrepMinutes] = useState(initialMaxPrepMinutes);
  const [sort, setSort] = useState<RecipeCatalogSort>(initialCatalog.filters.sort);
  const [error, setError] = useState(initialError);
  const [paginationError, setPaginationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialCatalog.pagination.hasMore);
  const [total, setTotal] = useState(initialCatalog.pagination.total);
  const [authenticated, setAuthenticated] = useState(() => hasAuthSessionHint());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const lastRequestedSignature = useRef(initialError ? "" : initialSignature);

  const effectiveSort: RecipeCatalogSort = query.trim() ? sort : sort === "relevance" ? "recent" : sort;
  const filterSignature = [query.trim(), source, mealType, difficulty, maxPrepMinutes, effectiveSort].join("|");

  useEffect(() => {
    if (authenticated) listFavorites().then((favorites) => setFavoriteIds(new Set(favorites.map((recipe) => recipe.id)))).catch(() => undefined);
    function handleAuthChange() {
      const nextAuthenticated = hasAuthSessionHint();
      setAuthenticated(nextAuthenticated);
      if (!nextAuthenticated) { setFavoriteIds(new Set()); return; }
      listFavorites().then((favorites) => setFavoriteIds(new Set(favorites.map((recipe) => recipe.id)))).catch(() => undefined);
    }
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
  }, [authenticated]);

  useEffect(() => {
    if (matches || filterSignature === lastRequestedSignature.current) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearching(true); setError(""); setPaginationError("");
      listRecipes({ limit: PAGE_SIZE, offset: 0, query: query.trim() || undefined, source: source || undefined, mealType: mealType || undefined, difficulty: difficulty || undefined, maxPrepMinutes: maxPrepMinutes ? Number(maxPrepMinutes) : undefined, sort: effectiveSort, signal: controller.signal })
        .then((nextCatalog) => {
          lastRequestedSignature.current = filterSignature;
          setRecipes(nextCatalog.items); setHasMore(nextCatalog.pagination.hasMore); setTotal(nextCatalog.pagination.total);
          const params = new URLSearchParams();
          if (query.trim()) params.set("q", query.trim());
          if (source) params.set("source", source);
          if (mealType) params.set("mealType", mealType);
          if (difficulty) params.set("difficulty", difficulty);
          if (maxPrepMinutes) params.set("maxPrepMinutes", maxPrepMinutes);
          if (effectiveSort !== (query.trim() ? "relevance" : "recent")) params.set("sort", effectiveSort);
          window.history.replaceState(window.history.state, "", `${window.location.pathname}${params.size ? `?${params.toString()}` : ""}`);
        })
        .catch(() => { if (!controller.signal.aborted) setError("Não foi possível buscar no catálogo agora. Tente novamente."); })
        .finally(() => { if (!controller.signal.aborted) setIsSearching(false); });
    }, SEARCH_DELAY_MS);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [difficulty, effectiveSort, filterSignature, matches, maxPrepMinutes, mealType, query, source]);

  async function retry() {
    setIsLoading(true); setError("");
    try {
      const nextCatalog = await listRecipes({ limit: PAGE_SIZE, offset: 0, query: query.trim() || undefined, source: source || undefined, mealType: mealType || undefined, difficulty: difficulty || undefined, maxPrepMinutes: maxPrepMinutes ? Number(maxPrepMinutes) : undefined, sort: effectiveSort });
      lastRequestedSignature.current = filterSignature; setRecipes(nextCatalog.items); setHasMore(nextCatalog.pagination.hasMore); setTotal(nextCatalog.pagination.total);
    } catch { setError("Não foi possível carregar o catálogo agora. Tente novamente."); } finally { setIsLoading(false); }
  }

  async function loadMore() {
    if (isLoadingMore || !hasMore || matches) return;
    setIsLoadingMore(true); setPaginationError("");
    try {
      const nextCatalog = await listRecipes({ limit: PAGE_SIZE, offset: recipes.length, query: query.trim() || undefined, source: source || undefined, mealType: mealType || undefined, difficulty: difficulty || undefined, maxPrepMinutes: maxPrepMinutes ? Number(maxPrepMinutes) : undefined, sort: effectiveSort });
      setRecipes((current) => mergeRecipes(current, nextCatalog.items)); setHasMore(nextCatalog.pagination.hasMore); setTotal(nextCatalog.pagination.total);
    } catch { setPaginationError("Não foi possível carregar mais receitas agora."); } finally { setIsLoadingMore(false); }
  }

  async function matchWithPantry() {
    setIsLoading(true); setError("");
    try { setMatches(await matchRecipesFromPantry()); } catch { setError("Não foi possível comparar sua despensa com as receitas agora."); } finally { setIsLoading(false); }
  }

  function clearFilters() { setSource(""); setMealType(""); setDifficulty(""); setMaxPrepMinutes(""); setSort(query.trim() ? "relevance" : "recent"); }
  function updateQuery(value: string) {
    const hadQuery = Boolean(query.trim()); const hasQuery = Boolean(value.trim());
    if (!hadQuery && hasQuery && sort === "recent") setSort("relevance");
    if (hadQuery && !hasQuery && sort === "relevance") setSort("recent");
    setQuery(value);
  }

  const normalizedQuery = normalizeIngredientName(query);
  const filteredRecipes = useMemo(() => {
    if (!matches) return recipes;
    return matches.filter((recipe) => !normalizedQuery || normalizeIngredientName(`${recipe.title} ${recipe.description} ${recipe.mealType}`).includes(normalizedQuery));
  }, [matches, normalizedQuery, recipes]);

  function updateFavorite(recipeId: string, favorite: boolean) {
    setFavoriteIds((current) => { const next = new Set(current); if (favorite) next.add(recipeId); else next.delete(recipeId); return next; });
  }

  if (isLoading) return <LoadingState label="Consultando a cozinha…" />;
  if (error) return <ErrorState message={error} onRetry={() => void retry()} />;
  if (recipes.length === 0 && !matches && !query && !source && !mealType && !difficulty && !maxPrepMinutes) return <EmptyState description="Quando as primeiras receitas forem cadastradas, elas aparecerão neste espaço." icon="R" title="O catálogo ainda está vazio" />;

  const countValue = matches ? filteredRecipes.length : total;
  const countLabel = query.trim() || source || mealType || difficulty || maxPrepMinutes ? "resultados" : countValue === 1 ? "receita" : "receitas";

  return (
    <div className={styles.catalog}>
      <div className={styles.pantryPanel}>
        <div><span className={styles.pantryEyebrow}>Sua cozinha decide</span><strong>Veja primeiro o que já dá para preparar.</strong><p>O Receitando compara automaticamente sua despensa com cada receita do catálogo.</p></div>
        {authenticated ? <button className={styles.pantryButton} onClick={() => void matchWithPantry()} type="button">{matches ? "Atualizar com minha despensa" : "Usar minha despensa"}</button> : <Link className={styles.pantryButton} href="/entrar?next=/receitas">Entrar para usar minha despensa</Link>}
      </div>
      {matches ? <div className={styles.matchSummary}><div><span>Resultado personalizado</span><strong>{matches.filter((recipe) => recipe.status === "READY").length} receitas para fazer agora</strong></div><button onClick={() => setMatches(null)} type="button">Voltar ao catálogo completo</button></div> : null}

      <div className={styles.toolbar}>
        <div className={styles.searchField}><label htmlFor="recipe-search">Buscar receitas</label><div className={styles.searchControl}><span aria-hidden="true" className={styles.searchIcon}>⌕</span><input autoComplete="off" id="recipe-search" onChange={(event) => updateQuery(event.target.value)} placeholder="Nome, refeição ou ingrediente" type="search" value={query} />{query ? <button aria-label="Limpar busca" className={styles.clearSearch} onClick={() => updateQuery("")} type="button">×</button> : null}</div><span className={styles.searchHint}>{isSearching ? "Procurando no caderno inteiro…" : "Busque pelo nome do prato ou por uma palavra-chave."}</span></div>
        <div aria-live="polite" className={styles.count}><strong>{countValue}</strong><span>{countLabel}</span></div>
      </div>

      {!matches ? <CatalogFilters difficulty={difficulty} maxPrepMinutes={maxPrepMinutes} mealType={mealType} onClear={clearFilters} onDifficultyChange={setDifficulty} onMaxPrepMinutesChange={setMaxPrepMinutes} onMealTypeChange={setMealType} onSortChange={setSort} onSourceChange={setSource} query={query} sort={effectiveSort} source={source} /> : null}

      {filteredRecipes.length > 0 ? (
        <>
          <div className={styles.grid}>{filteredRecipes.map((recipe) => { const match = "compatibility" in recipe ? recipe : null; const catalogRecipe = recipes.find((item) => item.id === recipe.id); return <RecipeCard compatibility={match?.compatibility} description={recipe.description} difficulty={recipe.difficulty} externalSource={catalogRecipe?.source.externalSource} imageUrl={recipe.imageUrl} initialFavorite={favoriteIds.has(recipe.id)} key={recipe.id} mealType={recipe.mealType} missingIngredients={match?.missingIngredients} onFavoriteChange={(favorite) => updateFavorite(recipe.id, favorite)} prepMinutes={recipe.prepMinutes} recipeId={recipe.id} servings={recipe.servings} slug={recipe.slug} sourceName={catalogRecipe?.source.name} status={match?.status} title={recipe.title} />; })}</div>
          {!matches && hasMore ? <div className={styles.pagination}><button disabled={isLoadingMore || isSearching} onClick={() => void loadMore()} type="button">{isLoadingMore ? "Carregando…" : "Carregar mais receitas"}</button><span>Você está vendo {recipes.length} de {total} receitas.</span>{paginationError ? <p role="alert">{paginationError}</p> : null}</div> : null}
        </>
      ) : isSearching ? <LoadingState label="Buscando receitas…" /> : <EmptyState description="Tente retirar um filtro, mudar a busca ou voltar ao catálogo completo." icon="?" title="Nenhuma receita combina com esses filtros" />}
    </div>
  );
}
