"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { normalizeIngredientName } from "@/lib/normalize-ingredient";
import { getIngredients, savePantryItem, type IngredientOption } from "@/services/pantry.service";
import { listRecipes } from "@/services/recipes.service";
import type { RecipeCatalogItem } from "@/types/recipe";

import styles from "./Header.module.css";

const SEARCH_DELAY_MS = 180;
const MIN_QUERY_LENGTH = 2;

export function GlobalHeaderSearch() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ingredientCache = useRef<IngredientOption[] | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<RecipeCatalogItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        window.requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (event.key === "Escape") setOpen(false);
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    window.addEventListener("keydown", handleShortcut);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    setFeedback("");

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setRecipes([]);
      setIngredients([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const [catalog, options] = await Promise.all([
          listRecipes({ query: trimmed, limit: 5, offset: 0, sort: "relevance", signal: controller.signal }),
          ingredientCache.current ? Promise.resolve(ingredientCache.current) : getIngredients(),
        ]);
        if (controller.signal.aborted) return;
        ingredientCache.current = options;
        const normalized = normalizeIngredientName(trimmed);
        setRecipes(catalog.items.slice(0, 5));
        setIngredients(
          options
            .filter((item) => item.normalizedName.includes(normalized) || normalizeIngredientName(item.name).includes(normalized))
            .slice(0, 5),
        );
      } catch {
        if (!controller.signal.aborted) setFeedback("Não foi possível buscar agora.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, SEARCH_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const allResultsUrl = useMemo(() => `/receitas?q=${encodeURIComponent(query.trim())}`, [query]);

  async function addIngredient(ingredient: IngredientOption) {
    if (addingId || addedIds.has(ingredient.id)) return;
    setAddingId(ingredient.id);
    setFeedback("");
    try {
      await savePantryItem(ingredient.id, null, null);
      setAddedIds((current) => new Set(current).add(ingredient.id));
      setFeedback(`${ingredient.name} foi adicionado à despensa.`);
    } catch {
      setFeedback("Entre na sua conta para adicionar ingredientes à despensa.");
    } finally {
      setAddingId(null);
    }
  }

  const hasQuery = query.trim().length >= MIN_QUERY_LENGTH;
  const hasResults = recipes.length > 0 || ingredients.length > 0;

  return (
    <div className={`${styles.globalSearch} ${open ? styles.globalSearchOpen : ""}`} ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Buscar receitas e ingredientes"
        className={styles.mobileSearchTrigger}
        onClick={() => {
          setOpen(true);
          window.requestAnimationFrame(() => inputRef.current?.focus());
        }}
        type="button"
      >
        <span aria-hidden="true">⌕</span>
      </button>

      <div aria-label="Busca global" className={styles.searchSurface} role="search">
        <div className={styles.searchInputRow}>
          <span aria-hidden="true" className={styles.searchIcon}>⌕</span>
          <input
            aria-controls="global-search-results"
            aria-expanded={open && hasQuery}
            aria-label="Buscar receitas ou ingredientes"
            autoComplete="off"
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar receita ou ingrediente"
            ref={inputRef}
            type="search"
            value={query}
          />
          <kbd className={styles.searchShortcut}>⌘/Ctrl K</kbd>
          <button aria-label="Fechar busca" className={styles.mobileSearchClose} onClick={() => setOpen(false)} type="button">×</button>
        </div>

        {open && hasQuery ? (
          <div aria-live="polite" className={styles.searchResults} id="global-search-results">
            {loading ? <div className={styles.searchStatus}>Buscando…</div> : null}
            {!loading && !hasResults && !feedback ? <div className={styles.searchStatus}>Nenhum resultado.</div> : null}

            {!loading && recipes.length > 0 ? (
              <section aria-labelledby="global-recipes-title" className={styles.searchGroup}>
                <div className={styles.searchGroupHeading}>
                  <h2 id="global-recipes-title">Receitas</h2>
                  <Link href={allResultsUrl}>Ver todas</Link>
                </div>
                <div className={styles.searchList}>
                  {recipes.map((recipe) => (
                    <Link className={styles.recipeSearchResult} href={`/receitas/${recipe.slug}`} key={recipe.id}>
                      <span>{recipe.title}</span>
                      <small>{recipe.prepMinutes} min · {recipe.mealType || "Receita"}</small>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {!loading && ingredients.length > 0 ? (
              <section aria-labelledby="global-pantry-title" className={styles.searchGroup}>
                <div className={styles.searchGroupHeading}>
                  <h2 id="global-pantry-title">Despensa</h2>
                </div>
                <div className={styles.searchList}>
                  {ingredients.map((ingredient) => {
                    const added = addedIds.has(ingredient.id);
                    return (
                      <div className={styles.ingredientSearchResult} key={ingredient.id}>
                        <span><strong>{ingredient.name}</strong><small>{ingredient.category}</small></span>
                        <button
                          disabled={addingId === ingredient.id || added}
                          onClick={() => void addIngredient(ingredient)}
                          type="button"
                        >
                          {added ? "Adicionado" : addingId === ingredient.id ? "Adicionando…" : "Adicionar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {feedback ? <p className={styles.searchFeedback}>{feedback}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
