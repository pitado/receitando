"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { CatalogRecipeCard } from "@/components/recipe/CatalogRecipeCard";
import { AUTH_CHANGED_EVENT, hasAuthSessionHint } from "@/services/auth-storage";
import {
  addFavorite,
  listFavorites,
} from "@/services/favorites.service";
import type { Recipe, RecipeCatalogItem } from "@/types/recipe";

import styles from "./page.module.css";

const MEAL_ORDER = [
  "Café da manhã",
  "Almoço",
  "Jantar",
  "Lanche",
  "Sobremesa",
] as const;

type UndoFavorite = {
  canUndo: boolean;
  index: number;
  recipe: Recipe;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function toCatalogRecipe(recipe: Recipe): RecipeCatalogItem {
  return {
    id: recipe.id,
    title: recipe.title,
    slug: recipe.slug,
    description: recipe.description,
    prepMinutes: recipe.prepMinutes,
    servings: recipe.servings,
    mealType: recipe.mealType,
    difficulty: recipe.difficulty,
    imageUrl: recipe.imageUrl,
    source: {
      name: recipe.source.name,
      externalSource: recipe.source.externalSource ?? null,
    },
    tags: recipe.tags,
  };
}

export function FavoritesClient() {
  const [authenticated, setAuthenticated] = useState(() => hasAuthSessionHint());
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(() => hasAuthSessionHint());
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [mealType, setMealType] = useState("");
  const [undoFavorite, setUndoFavorite] = useState<UndoFavorite | null>(null);
  const [undoing, setUndoing] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const undoTimer = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      setRecipes(await listFavorites());
    } catch {
      setError("Não foi possível carregar seus favoritos agora.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      listFavorites()
        .then((favorites) => setRecipes(favorites))
        .catch(() => setError("Não foi possível carregar seus favoritos agora."))
        .finally(() => setLoading(false));
    }

    function handleAuthChange() {
      const nextAuthenticated = hasAuthSessionHint();
      setAuthenticated(nextAuthenticated);

      if (!nextAuthenticated) {
        setRecipes([]);
        setLoading(false);
        setError("");
        setQuery("");
        setMealType("");
        return;
      }

      setLoading(true);
      setError("");
      listFavorites()
        .then((favorites) => setRecipes(favorites))
        .catch(() => setError("Não foi possível carregar seus favoritos agora."))
        .finally(() => setLoading(false));
    }

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
  }, [authenticated]);

  useEffect(
    () => () => {
      if (undoTimer.current !== null) window.clearTimeout(undoTimer.current);
    },
    [],
  );

  const mealCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const recipe of recipes) {
      const meal = recipe.mealType || "Receita";
      counts.set(meal, (counts.get(meal) ?? 0) + 1);
    }
    return counts;
  }, [recipes]);

  const mealTabs = useMemo(() => {
    const known = MEAL_ORDER.filter((meal) => mealCounts.has(meal));
    const extras = [...mealCounts.keys()]
      .filter((meal) => !MEAL_ORDER.includes(meal as (typeof MEAL_ORDER)[number]))
      .sort((first, second) => first.localeCompare(second, "pt-BR"));

    return ["", ...known, ...extras];
  }, [mealCounts]);

  const effectiveMealType =
    mealType && mealCounts.has(mealType) ? mealType : "";

  const visibleRecipes = useMemo(() => {
    const normalizedQuery = normalize(query);

    return recipes.filter((recipe) => {
      const matchesMeal =
        !effectiveMealType || recipe.mealType === effectiveMealType;
      const matchesQuery =
        !normalizedQuery || normalize(recipe.title).includes(normalizedQuery);
      return matchesMeal && matchesQuery;
    });
  }, [effectiveMealType, query, recipes]);

  function clearUndoTimer() {
    if (undoTimer.current !== null) {
      window.clearTimeout(undoTimer.current);
      undoTimer.current = null;
    }
  }

  function focusAfterRemoval(removedIndex: number) {
    window.setTimeout(() => {
      const cards =
        gridRef.current?.querySelectorAll<HTMLElement>("[data-favorite-card]") ??
        [];
      const target = cards[Math.min(removedIndex, Math.max(0, cards.length - 1))];

      if (target) target.focus();
      else searchRef.current?.focus();
    }, 0);
  }

  function removeFromView(recipe: Recipe, favorite: boolean) {
    if (favorite) {
      setRecipes((current) => {
        if (current.some((item) => item.id === recipe.id)) return current;

        const snapshot = undoFavorite;
        const next = [...current];
        next.splice(
          Math.min(snapshot?.index ?? current.length, current.length),
          0,
          recipe,
        );
        return next;
      });
      setUndoFavorite(null);
      clearUndoTimer();
      return;
    }

    const index = recipes.findIndex((item) => item.id === recipe.id);
    setRecipes((current) => current.filter((item) => item.id !== recipe.id));
    setUndoFavorite({
      canUndo: false,
      index: index < 0 ? recipes.length : index,
      recipe,
    });
    clearUndoTimer();
    undoTimer.current = window.setTimeout(() => {
      setUndoFavorite(null);
      undoTimer.current = null;
    }, 5000);
    focusAfterRemoval(Math.max(0, index));
  }

  function handleFavoriteSettled(
    recipe: Recipe,
    favorite: boolean,
    success: boolean,
  ) {
    if (favorite) return;

    if (!success) {
      setUndoFavorite((current) =>
        current?.recipe.id === recipe.id ? null : current,
      );
      clearUndoTimer();
      return;
    }

    setUndoFavorite((current) =>
      current?.recipe.id === recipe.id
        ? { ...current, canUndo: true }
        : current,
    );
  }

  async function undoRemoval() {
    if (!undoFavorite?.canUndo || undoing) return;

    const snapshot = undoFavorite;
    setUndoing(true);

    try {
      await addFavorite(snapshot.recipe.id);
      setRecipes((current) => {
        if (current.some((recipe) => recipe.id === snapshot.recipe.id)) {
          return current;
        }

        const next = [...current];
        next.splice(Math.min(snapshot.index, current.length), 0, snapshot.recipe);
        return next;
      });
      setUndoFavorite(null);
      clearUndoTimer();
    } catch {
      setError("Não foi possível devolver a receita aos favoritos agora.");
    } finally {
      setUndoing(false);
    }
  }

  function clearSearchAndMeal() {
    setQuery("");
    setMealType("");
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }

  if (!authenticated) {
    return (
      <main className={styles.page}>
        <section className={styles.guest}>
          <div className={styles.guestGrid}>
            <div className={styles.guestIntro}>
              <h1>
                Seu caderno <span>de receitas.</span>
              </h1>
              <p>
                As receitas que você marcou pra fazer de novo, guardadas num lugar só.
              </p>

              <div className={styles.guestTip}>
                <span aria-hidden="true">♡</span>
                <p>
                  Toque no coração de qualquer receita do catálogo e ela vem direto pra cá.
                </p>
              </div>
            </div>

            <section className={styles.loginCard} aria-labelledby="favorites-login-title">
              <div className={styles.preview} aria-hidden="true">
                <div className={styles.previewCards}>
                  <div><i /><b /></div>
                  <div><i /><b /></div>
                  <div><i /><b /></div>
                </div>
                <span className={styles.lockIcon}>
                  <svg viewBox="0 0 24 24">
                    <rect height="10" rx="2" width="14" x="5" y="11" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </span>
              </div>

              <h2 id="favorites-login-title">Entre pra abrir seu caderno</h2>
              <p>
                Seus favoritos ficam ligados à sua conta, pra você achar tudo de novo em qualquer aparelho.
              </p>
              <Link className={styles.loginButton} href="/entrar?next=/favoritos">
                Entrar na minha conta
              </Link>
              <p className={styles.signupPrompt}>
                Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
              </p>
            </section>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroHeading}>
            <h1>
              Seu caderno <span>de receitas.</span>
            </h1>
            <p className={styles.total}>
              <strong>{recipes.length}</strong>
              <span>
                {recipes.length === 1 ? "receita guardada" : "receitas guardadas"}
              </span>
            </p>
          </div>

          {!loading && !error && recipes.length > 0 ? (
            <div className={styles.tools}>
              <div className={styles.search}>
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <label className={styles.srOnly} htmlFor="favorites-search">
                  Buscar nos favoritos
                </label>
                <input
                  autoComplete="off"
                  id="favorites-search"
                  onChange={(event) => setQuery(event.currentTarget.value)}
                  placeholder="Buscar nos favoritos"
                  ref={searchRef}
                  type="search"
                  value={query}
                />
              </div>

              <div aria-label="Refeição" className={styles.tabs} role="tablist">
                {mealTabs.map((meal) => {
                  const label = meal || "Todas";
                  const count = meal ? mealCounts.get(meal) ?? 0 : recipes.length;

                  return (
                    <button
                      aria-selected={effectiveMealType === meal}
                      key={meal || "all"}
                      onClick={() => setMealType(meal)}
                      role="tab"
                      type="button"
                    >
                      {label} <small>{count}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.contentArea}>
        <div className={styles.container}>
          {loading ? (
            <div aria-label="Carregando favoritos" className={styles.grid} role="status">
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
              <span className={styles.stateBubble} aria-hidden="true">!</span>
              <h2>Algo saiu do ponto</h2>
              <p>{error}</p>
              <button onClick={() => void load()} type="button">
                Tentar de novo
              </button>
            </div>
          ) : recipes.length === 0 ? (
            <div className={styles.stateCard}>
              <span className={styles.heartBubble} aria-hidden="true">♡</span>
              <h2>Seu caderno ainda está em branco</h2>
              <p>
                Toque no coração de qualquer receita e ela fica guardada aqui pra quando bater a vontade.
              </p>
              <Link className={styles.exploreButton} href="/receitas">
                Explorar receitas
              </Link>
              <p className={styles.secondaryAction}>
                ou veja{" "}
                <Link href="/combinar">o que dá pra fazer com a sua despensa</Link>
              </p>
            </div>
          ) : visibleRecipes.length === 0 ? (
            <div className={styles.stateCard}>
              <h2>Nada por aqui com esse nome</h2>
              <p>
                Tente outra palavra ou{" "}
                <button className={styles.inlineAction} onClick={clearSearchAndMeal} type="button">
                  limpe a busca
                </button>
                .
              </p>
            </div>
          ) : (
            <div className={styles.grid} ref={gridRef}>
              {visibleRecipes.map((recipe) => (
                <div
                  className={styles.favoriteItem}
                  data-favorite-card
                  key={recipe.id}
                  tabIndex={-1}
                >
                  <CatalogRecipeCard
                    authenticated
                    favoriteAriaLabel={`Remover dos favoritos: ${recipe.title}`}
                    initialFavorite
                    onFavoriteChange={(favorite) =>
                      removeFromView(recipe, favorite)
                    }
                    onFavoriteSettled={(favorite, success) =>
                      handleFavoriteSettled(recipe, favorite, success)
                    }
                    recipe={toCatalogRecipe(recipe)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {undoFavorite ? (
        <div className={styles.undoToast} role="status">
          <span>
            <strong>{undoFavorite.recipe.title}</strong> saiu do caderno.
          </span>
          <button
            disabled={!undoFavorite.canUndo || undoing}
            onClick={() => void undoRemoval()}
            type="button"
          >
            {undoing ? "Voltando…" : "Desfazer"}
          </button>
        </div>
      ) : null}
    </main>
  );
}
