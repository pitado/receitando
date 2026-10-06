"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { getHomeFeed, type HomePopularRecipe } from "@/services/home.service";
import { listRecipes } from "@/services/recipes.service";
import type { RecipeCatalogItem } from "@/types/recipe";

import { BiteWordmark } from "./BiteWordmark";
import styles from "./HomeHeader.module.css";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

function highlightTitle(title: string, query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return title;

  for (let index = 0; index <= title.length - query.length; index += 1) {
    const candidate = normalize(title.slice(index, index + query.length));
    if (candidate === normalizedQuery) {
      return (
        <>
          {title.slice(0, index)}
          <mark>{title.slice(index, index + query.length)}</mark>
          {title.slice(index + query.length)}
        </>
      );
    }
  }

  return title;
}

function SearchRecipe({ recipe, query, onNavigate, tabIndex }: {
  recipe: RecipeCatalogItem | HomePopularRecipe;
  query: string;
  onNavigate: () => void;
  tabIndex: number;
}) {
  return (
    <Link
      className={styles.searchResult}
      href={"/receitas/" + recipe.slug}
      onClick={onNavigate}
      tabIndex={tabIndex}
    >
      <span className={styles.searchResultName}>{highlightTitle(recipe.title, query)}</span>
      <span className={styles.searchResultMeta}>{recipe.mealType || "Receita"}, {recipe.prepMinutes} min</span>
    </Link>
  );
}

export function HomeHeader() {
  const rootRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecipeCatalogItem[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const [suggestions, setSuggestions] = useState<HomePopularRecipe[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getHomeFeed()
      .then((feed) => {
        if (!cancelled) setSuggestions(feed.popular.slice(0, 4));
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        window.requestAnimationFrame(() => inputRef.current?.focus());
      }

      if (event.key === "Escape" && open) {
        setOpen(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
      }
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node) && open) {
        setOpen(false);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
      }
    }

    window.addEventListener("keydown", handleShortcut);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleShortcut);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
      setResults([]);
      setResultCount(0);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const catalog = await listRecipes({
          query: normalizedQuery,
          limit: 5,
          offset: 0,
          sort: "relevance",
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;
        setResults(catalog.items.slice(0, 5));
        setResultCount(catalog.pagination.total);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
          setResultCount(0);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const hasQuery = Boolean(normalize(query));
  const panelLabel = useMemo(() => hasQuery ? "Resultados da busca" : "Navegação e sugestões", [hasQuery]);

  function openSearch() {
    setOpen(true);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeSearch() {
    setOpen(false);
    setQuery("");
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <header className={styles.header} ref={rootRef}>
      <div className={styles.topBar}>
        <div className={styles.topInner}>
          <button
            aria-expanded={open}
            aria-label="Buscar"
            className={styles.searchTrigger}
            onClick={openSearch}
            ref={triggerRef}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m20 20-4.3-4.3m2.3-5.2a7.2 7.2 0 1 1-14.4 0 7.2 7.2 0 0 1 14.4 0Z" />
            </svg>
          </button>

          <Link aria-label="Receitando — início" className={styles.logo} href="/">
            <BiteWordmark compact />
          </Link>

          <Link className={styles.submitButton} href="/enviar-receita">
            <span className={styles.desktopSubmit}>Enviar receita</span>
            <span className={styles.mobileSubmit}>Enviar</span>
          </Link>
        </div>

        <div
          aria-hidden={!open}
          aria-label={panelLabel}
          className={styles.panel}
          role="dialog"
        >
          <div className={styles.searchBar}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m20 20-4.3-4.3m2.3-5.2a7.2 7.2 0 1 1-14.4 0 7.2 7.2 0 0 1 14.4 0Z" />
            </svg>
            <input
              aria-label="Buscar pelo nome do prato"
              autoComplete="off"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar pelo nome do prato"
              ref={inputRef}
              tabIndex={open ? 0 : -1}
              type="search"
              value={query}
            />
            <button aria-label="Fechar busca" className={styles.closeButton} onClick={closeSearch} tabIndex={open ? 0 : -1} type="button">×</button>
          </div>

          <div className={styles.panelGrid}>
            <section aria-labelledby="home-go-title">
              <p className={styles.panelLabel} id="home-go-title">Ir para</p>
              <nav className={styles.goList}>
                <Link href="/combinar" onClick={closeSearch} tabIndex={open ? 0 : -1}><strong>Combinar</strong><span>o que dá pra fazer agora</span></Link>
                <Link href="/despensa" onClick={closeSearch} tabIndex={open ? 0 : -1}><strong>Despensa</strong><span>o que você tem em casa</span></Link>
                <Link href="/favoritos" onClick={closeSearch} tabIndex={open ? 0 : -1}><strong>Favoritos</strong><span>seu caderno de receitas</span></Link>
                <Link href="/receitas" onClick={closeSearch} tabIndex={open ? 0 : -1}><strong>Receitas</strong><span>catálogo com o que já existe</span></Link>
              </nav>
            </section>

            <section aria-labelledby="home-search-title">
              <div className={styles.resultsHeading}>
                <p className={styles.panelLabel} id="home-search-title">{hasQuery ? resultCount + " resultados" : "Sugestões"}</p>
                {hasQuery ? <span>{loading ? "Buscando..." : "até 5 itens"}</span> : null}
              </div>

              {loading ? <p className={styles.searchEmpty}>Buscando receitas...</p> : null}

              {!loading && !hasQuery ? (
                <div className={styles.resultList}>
                  {suggestions.map((recipe) => <SearchRecipe key={recipe.id} onNavigate={closeSearch} query="" recipe={recipe} tabIndex={open ? 0 : -1} />)}
                </div>
              ) : null}

              {!loading && hasQuery && results.length > 0 ? (
                <div className={styles.resultList}>
                  {results.map((recipe) => <SearchRecipe key={recipe.id} onNavigate={closeSearch} query={query} recipe={recipe} tabIndex={open ? 0 : -1} />)}
                </div>
              ) : null}

              {!loading && hasQuery && results.length === 0 ? (
                <p className={styles.searchEmpty}>
                  Nenhum prato com esse nome. Tente outra palavra ou monte sua bancada com os ingredientes que você tem.
                </p>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </header>
  );
}
