"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CatalogFilters } from "@/components/recipe/CatalogFilters";
import { CatalogRecipeCard } from "@/components/recipe/CatalogRecipeCard";
import { AUTH_CHANGED_EVENT, hasAuthSessionHint } from "@/services/auth-storage";
import { listFavorites } from "@/services/favorites.service";
import { getPantry } from "@/services/pantry.service";
import {
  listRecipes,
  matchRecipesFromPantry,
} from "@/services/recipes.service";
import type {
  MatchRecipeResult,
  RecipeCatalogItem,
  RecipeCatalogResponse,
  RecipeCatalogSort,
  RecipeDifficulty,
} from "@/types/recipe";

import styles from "./RecipesCatalog.module.css";

interface RecipesCatalogProps {
  catalogTotal: number;
  initialCatalog: RecipeCatalogResponse;
  initialError?: string;
}

const PAGE_SIZE = 36;
const SEARCH_DELAY_MS = 300;

const mealTabs = [
  { value: "", label: "Todas", icon: "▦" },
  { value: "Café da manhã", label: "Café da manhã", icon: "☕" },
  { value: "Almoço", label: "Almoço", icon: "🍲" },
  { value: "Jantar", label: "Jantar", icon: "🌙" },
  { value: "Lanche", label: "Lanche", icon: "🍪" },
  { value: "Sobremesa", label: "Sobremesa", icon: "🍰" },
] as const;

function mergeRecipes(
  current: RecipeCatalogItem[],
  incoming: RecipeCatalogItem[],
): RecipeCatalogItem[] {
  const byId = new Map(current.map((recipe) => [recipe.id, recipe]));
  for (const recipe of incoming) byId.set(recipe.id, recipe);
  return [...byId.values()];
}

export function RecipesCatalog({
  catalogTotal,
  initialCatalog,
  initialError = "",
}: RecipesCatalogProps) {
  const initialMaxPrepMinutes = initialCatalog.filters.maxPrepMinutes
    ? String(initialCatalog.filters.maxPrepMinutes)
    : "";
  const initialSignature = [
    initialCatalog.filters.query,
    initialCatalog.filters.source,
    initialCatalog.filters.mealType,
    initialCatalog.filters.difficulty,
    initialMaxPrepMinutes,
    initialCatalog.filters.sort,
  ].join("|");

  const [recipes, setRecipes] = useState(initialCatalog.items);
  const [query, setQuery] = useState(initialCatalog.filters.query);
  const [source, setSource] = useState(initialCatalog.filters.source);
  const [mealType, setMealType] = useState(initialCatalog.filters.mealType);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty | "">(
    initialCatalog.filters.difficulty,
  );
  const [maxPrepMinutes, setMaxPrepMinutes] = useState(initialMaxPrepMinutes);
  const [sort, setSort] = useState<RecipeCatalogSort>(
    initialCatalog.filters.sort,
  );
  const [error, setError] = useState(initialError);
  const [paginationError, setPaginationError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialCatalog.pagination.hasMore);
  const [total, setTotal] = useState(initialCatalog.pagination.total);
  const [authenticated, setAuthenticated] = useState(() => hasAuthSessionHint());
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [pantryMatches, setPantryMatches] = useState<MatchRecipeResult[] | null>(
    null,
  );
  const [pantryItemCount, setPantryItemCount] = useState(0);
  const [pantryError, setPantryError] = useState("");
  const [pantryLoading, setPantryLoading] = useState(false);
  const [prioritizePantry, setPrioritizePantry] = useState(false);
  const lastRequestedSignature = useRef(initialError ? "" : initialSignature);

  const effectiveSort: RecipeCatalogSort = query.trim()
    ? sort
    : sort === "relevance"
      ? "recent"
      : sort;

  const filterSignature = [
    query.trim(),
    source,
    mealType,
    difficulty,
    maxPrepMinutes,
    effectiveSort,
  ].join("|");

  const refreshPantryPersonalization = useCallback(async () => {
    setPantryLoading(true);
    setPantryError("");

    try {
      const [matches, pantry] = await Promise.all([
        matchRecipesFromPantry(),
        getPantry(),
      ]);
      setPantryMatches(matches);
      setPantryItemCount(pantry.length);
    } catch {
      setPantryMatches(null);
      setPantryItemCount(0);
      setPrioritizePantry(false);
      setPantryError("Não foi possível comparar sua despensa agora.");
    } finally {
      setPantryLoading(false);
    }
  }, []);

  useEffect(() => {
    let initialPantryTimer: number | null = null;

    if (authenticated) {
      listFavorites()
        .then((favorites) =>
          setFavoriteIds(new Set(favorites.map((recipe) => recipe.id))),
        )
        .catch(() => undefined);

      initialPantryTimer = window.setTimeout(() => {
        void refreshPantryPersonalization();
      }, 0);
    }

    function handleAuthChange() {
      const nextAuthenticated = hasAuthSessionHint();
      setAuthenticated(nextAuthenticated);

      if (!nextAuthenticated) {
        setFavoriteIds(new Set());
        setPantryMatches(null);
        setPantryItemCount(0);
        setPantryError("");
        setPrioritizePantry(false);
        return;
      }

      listFavorites()
        .then((favorites) =>
          setFavoriteIds(new Set(favorites.map((recipe) => recipe.id))),
        )
        .catch(() => undefined);
      void refreshPantryPersonalization();
    }

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => {
      if (initialPantryTimer !== null) window.clearTimeout(initialPantryTimer);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    };
  }, [authenticated, refreshPantryPersonalization]);

  useEffect(() => {
    if (filterSignature === lastRequestedSignature.current) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      setError("");
      setPaginationError("");

      listRecipes({
        limit: PAGE_SIZE,
        offset: 0,
        query: query.trim() || undefined,
        source: source || undefined,
        mealType: mealType || undefined,
        difficulty: difficulty || undefined,
        maxPrepMinutes: maxPrepMinutes ? Number(maxPrepMinutes) : undefined,
        sort: effectiveSort,
        signal: controller.signal,
      })
        .then((nextCatalog) => {
          lastRequestedSignature.current = filterSignature;
          setRecipes(nextCatalog.items);
          setHasMore(nextCatalog.pagination.hasMore);
          setTotal(nextCatalog.pagination.total);

          const params = new URLSearchParams();
          if (query.trim()) params.set("q", query.trim());
          if (source) params.set("source", source);
          if (mealType) params.set("mealType", mealType);
          if (difficulty) params.set("difficulty", difficulty);
          if (maxPrepMinutes) params.set("maxPrepMinutes", maxPrepMinutes);
          if (
            effectiveSort !== (query.trim() ? "relevance" : "recent")
          ) {
            params.set("sort", effectiveSort);
          }

          window.history.replaceState(
            window.history.state,
            "",
            `${window.location.pathname}${params.size ? `?${params.toString()}` : ""}`,
          );
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
  }, [
    difficulty,
    effectiveSort,
    filterSignature,
    maxPrepMinutes,
    mealType,
    query,
    source,
  ]);

  async function retry() {
    setIsLoading(true);
    setError("");

    try {
      const nextCatalog = await listRecipes({
        limit: PAGE_SIZE,
        offset: 0,
        query: query.trim() || undefined,
        source: source || undefined,
        mealType: mealType || undefined,
        difficulty: difficulty || undefined,
        maxPrepMinutes: maxPrepMinutes ? Number(maxPrepMinutes) : undefined,
        sort: effectiveSort,
      });
      lastRequestedSignature.current = filterSignature;
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
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setPaginationError("");

    try {
      const nextCatalog = await listRecipes({
        limit: PAGE_SIZE,
        offset: recipes.length,
        query: query.trim() || undefined,
        source: source || undefined,
        mealType: mealType || undefined,
        difficulty: difficulty || undefined,
        maxPrepMinutes: maxPrepMinutes ? Number(maxPrepMinutes) : undefined,
        sort: effectiveSort,
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

  function clearFilters() {
    setQuery("");
    setSource("");
    setMealType("");
    setDifficulty("");
    setMaxPrepMinutes("");
    setSort("recent");
  }

  function updateQuery(value: string) {
    const hadQuery = Boolean(query.trim());
    const hasQuery = Boolean(value.trim());

    if (!hadQuery && hasQuery && sort === "recent") setSort("relevance");
    if (hadQuery && !hasQuery && sort === "relevance") setSort("recent");

    setQuery(value);
  }

  function updateFavorite(recipeId: string, favorite: boolean) {
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (favorite) next.add(recipeId);
      else next.delete(recipeId);
      return next;
    });
  }

  const matchById = useMemo(
    () => new Map((pantryMatches ?? []).map((match) => [match.id, match])),
    [pantryMatches],
  );

  const displayRecipes = useMemo(() => {
    if (!authenticated || !prioritizePantry || !pantryMatches) return recipes;

    const originalIndex = new Map(
      recipes.map((recipe, index) => [recipe.id, index]),
    );

    return [...recipes].sort((first, second) => {
      const firstCompatibility = matchById.get(first.id)?.compatibility ?? -1;
      const secondCompatibility = matchById.get(second.id)?.compatibility ?? -1;

      return (
        secondCompatibility - firstCompatibility ||
        (originalIndex.get(first.id) ?? 0) - (originalIndex.get(second.id) ?? 0)
      );
    });
  }, [
    authenticated,
    matchById,
    pantryMatches,
    prioritizePantry,
    recipes,
  ]);

  const readyRecipeCount =
    pantryMatches?.filter((recipe) => recipe.compatibility === 100).length ?? 0;
  const progress =
    total > 0 ? Math.min(100, Math.round((recipes.length / total) * 100)) : 0;
  const hasFilters = Boolean(
    query.trim() || source || mealType || difficulty || maxPrepMinutes,
  );
  const busy = isLoading || isSearching;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroHeading}>
            <h1>
              O que vai pra <span>mesa hoje?</span>
            </h1>
            <p className={styles.catalogTotal}>
              <strong>{catalogTotal}</strong>
              <span>receitas no catálogo</span>
            </p>
          </div>

          <div className={styles.search}>
            <svg aria-hidden="true" className={styles.searchIcon} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <label className={styles.srOnly} htmlFor="recipe-search">
              Buscar receitas
            </label>
            <input
              autoComplete="off"
              id="recipe-search"
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Busque pelo nome do prato ou por uma palavra-chave"
              type="search"
              value={query}
            />
            {query ? (
              <button
                className={styles.clearSearch}
                onClick={() => updateQuery("")}
                type="button"
              >
                Limpar
              </button>
            ) : null}
          </div>

          <div
            aria-label="Refeição"
            className={styles.mealTabs}
            role="tablist"
          >
            {mealTabs.map((tab) => (
              <button
                aria-selected={mealType === tab.value}
                key={tab.value || "all"}
                onClick={() => setMealType(tab.value)}
                role="tab"
                type="button"
              >
                <span aria-hidden="true">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.pantryBanner}>
            <div className={styles.pantryInfo}>
              <span className={styles.pantryIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect height="18" rx="2" width="12" x="6" y="3" />
                  <path d="M6 11h12M9 7h1M9 15h1" />
                </svg>
              </span>

              <div>
                {!authenticated ? (
                  <>
                    <h2>Veja primeiro o que já dá pra preparar</h2>
                    <p>
                      Entre e o Receitando compara sua despensa com cada receita do catálogo.
                    </p>
                  </>
                ) : pantryLoading ? (
                  <>
                    <h2>Comparando com a sua despensa…</h2>
                    <p>Organizando as receitas com o que você já tem em casa.</p>
                  </>
                ) : pantryMatches ? (
                  <>
                    <h2>
                      Com a sua despensa, <span>{readyRecipeCount}</span>{" "}
                      {readyRecipeCount === 1
                        ? "receita já dá"
                        : "receitas já dão"}{" "}
                      pra fazer
                    </h2>
                    <p>
                      {pantryItemCount}{" "}
                      {pantryItemCount === 1
                        ? "ingrediente guardado"
                        : "ingredientes guardados"}{" "}
                      · <Link href="/despensa">editar despensa</Link>
                    </p>
                  </>
                ) : (
                  <>
                    <h2>Sua despensa continua por perto</h2>
                    <p>{pantryError}</p>
                  </>
                )}
              </div>
            </div>

            {!authenticated ? (
              <Link
                className={styles.pantryLogin}
                href="/entrar?next=/receitas"
              >
                Entrar para usar minha despensa
              </Link>
            ) : pantryMatches ? (
              <label className={styles.switchLabel}>
                <button
                  aria-checked={prioritizePantry}
                  aria-label="Mostrar primeiro o que dá para fazer"
                  className={styles.switch}
                  onClick={() => setPrioritizePantry((current) => !current)}
                  role="switch"
                  type="button"
                />
                <span>Mostrar primeiro o que dá pra fazer</span>
              </label>
            ) : null}
          </div>
        </div>
      </section>

      <main className={styles.catalogArea}>
        <div className={styles.container}>
          <CatalogFilters
            difficulty={difficulty}
            maxPrepMinutes={maxPrepMinutes}
            mealType={mealType}
            onClear={clearFilters}
            onDifficultyChange={setDifficulty}
            onMaxPrepMinutesChange={setMaxPrepMinutes}
            onMealTypeChange={setMealType}
            onQueryChange={updateQuery}
            onSortChange={setSort}
            onSourceChange={setSource}
            query={query}
            resultCount={total}
            sort={effectiveSort}
            source={source}
          />

          {busy ? (
            <div
              aria-label="Carregando receitas"
              className={styles.grid}
              role="status"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <div className={styles.skeletonCard} key={index}>
                  <span className={styles.skeletonImage} />
                  <span className={styles.skeletonLineShort} />
                  <span className={styles.skeletonLine} />
                  <span className={styles.skeletonLineMedium} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className={styles.stateCard}>
              <span className={styles.stateIcon} aria-hidden="true">!</span>
              <h2>Algo saiu do ponto</h2>
              <p>{error}</p>
              <button onClick={() => void retry()} type="button">
                Tentar de novo
              </button>
            </div>
          ) : displayRecipes.length > 0 ? (
            <>
              <div className={styles.grid}>
                {displayRecipes.map((recipe) => (
                  <CatalogRecipeCard
                    authenticated={authenticated}
                    initialFavorite={favoriteIds.has(recipe.id)}
                    key={recipe.id}
                    match={matchById.get(recipe.id)}
                    onFavoriteChange={(favorite) =>
                      updateFavorite(recipe.id, favorite)
                    }
                    recipe={recipe}
                  />
                ))}
              </div>

              <div className={styles.pagination}>
                <div className={styles.progress}>
                  <p>
                    Você está vendo {recipes.length} de {total} receitas
                  </p>
                  <span aria-hidden="true">
                    <span style={{ width: `${progress}%` }} />
                  </span>
                </div>

                {hasMore ? (
                  <button
                    disabled={isLoadingMore || isSearching}
                    onClick={() => void loadMore()}
                    type="button"
                  >
                    {isLoadingMore
                      ? "Carregando…"
                      : "Carregar mais receitas"}
                  </button>
                ) : (
                  <p className={styles.endMessage}>
                    Você chegou ao fim do cardápio.
                  </p>
                )}

                {paginationError ? (
                  <p className={styles.paginationError} role="alert">
                    {paginationError}
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div className={styles.stateCard}>
              <span className={styles.stateIcon} aria-hidden="true">⌕</span>
              <h2>
                {hasFilters
                  ? "Nenhuma receita com esses filtros"
                  : "O catálogo ainda está vazio"}
              </h2>
              <p>
                {hasFilters
                  ? "Tente tirar algum filtro ou buscar outra palavra."
                  : "Quando as primeiras receitas forem cadastradas, elas aparecerão neste espaço."}
              </p>
              {hasFilters ? (
                <button onClick={clearFilters} type="button">
                  Limpar filtros
                </button>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
