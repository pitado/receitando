"use client";

import Link from "next/link";
import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { normalizeIngredientName } from "@/lib/normalize-ingredient";
import { ApiError } from "@/services/api-client";
import { hasAuthSessionHint } from "@/services/auth-storage";
import { getHomeFeed } from "@/services/home.service";
import {
  getIngredients,
  getPantry,
  type IngredientOption,
  type PantryItem,
  removePantryItem,
  savePantryItem,
} from "@/services/pantry.service";
import { matchRecipesFromPantry } from "@/services/recipes.service";
import type { MatchRecipeResult } from "@/types/recipe";

import styles from "./page.module.css";

const DAY_MS = 24 * 60 * 60 * 1000;
const MATCH_DEBOUNCE_MS = 320;
const UNIT_OPTIONS = [
  "unidade",
  "g",
  "kg",
  "ml",
  "l",
  "xícara",
  "colher de sopa",
  "colher de chá",
] as const;

function daysUntil(dateValue: string | null): number | null {
  if (!dateValue) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return null;

  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.UTC(year, month - 1, day) - todayUtc) / DAY_MS);
}

function expirationLabel(dateValue: string | null): string | null {
  const days = daysUntil(dateValue);
  if (days === null || !dateValue) return null;
  if (days < -1) return `Venceu há ${Math.abs(days)} dias`;
  if (days === -1) return "Venceu ontem";
  if (days === 0) return "Vence hoje";
  if (days === 1) return "Vence amanhã";
  if (days <= 7) return `Vence em ${days} dias`;

  const [year, month, day] = dateValue.split("-");
  return `Validade ${day}/${month}/${year}`;
}

function formatQuantity(item: PantryItem): string | null {
  if (item.quantity === null) return null;
  const value = String(item.quantity).replace(".", ",");
  return item.unit ? `${value} ${item.unit}` : value;
}

function optimisticPantryItem(
  ingredient: IngredientOption,
  expiresAt: string | null,
): PantryItem {
  const now = new Date().toISOString();

  return {
    id: `optimistic-${ingredient.id}`,
    quantity: null,
    unit: null,
    expiresAt,
    createdAt: now,
    updatedAt: now,
    ingredientId: ingredient.id,
    ingredientName: ingredient.name,
    normalizedName: ingredient.normalizedName,
    category: ingredient.category,
  };
}

function getRequestError(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function PantryClient() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [query, setQuery] = useState("");
  const [nextExpiry, setNextExpiry] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState("");
  const [undoItem, setUndoItem] = useState<PantryItem | null>(null);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editExpiry, setEditExpiry] = useState("");
  const [itemError, setItemError] = useState("");
  const [recipeCount, setRecipeCount] = useState(0);
  const [matches, setMatches] = useState<MatchRecipeResult[]>([]);
  const [matchStatus, setMatchStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [matchError, setMatchError] = useState("");
  const [authenticated] = useState(() => hasAuthSessionHint());

  const undoTimer = useRef<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    getHomeFeed()
      .then((feed) => {
        if (!cancelled) setRecipeCount(feed.totals.recipes);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPantry() {
      await Promise.resolve();
      if (cancelled) return;

      if (!authenticated) {
        setLoading(false);
        return;
      }

      try {
        const [pantry, catalog] = await Promise.all([getPantry(), getIngredients()]);
        if (cancelled) return;
        setItems(pantry);
        setIngredients(catalog);
      } catch (cause: unknown) {
        if (!cancelled) {
          setError(
            getRequestError(cause, "Não foi possível carregar sua despensa."),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPantry();

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  useEffect(
    () => () => {
      if (undoTimer.current !== null) window.clearTimeout(undoTimer.current);
    },
    [],
  );

  useEffect(() => {
    if (!authenticated || loading) return;

    if (items.length === 0) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setMatchStatus("loading");
      setMatchError("");

      try {
        const result = await matchRecipesFromPantry(controller.signal);
        if (controller.signal.aborted) return;
        setMatches(result.slice(0, 4));
        setMatchStatus("ready");
      } catch (cause: unknown) {
        if (controller.signal.aborted) return;
        setMatches([]);
        setMatchStatus("error");
        setMatchError(
          getRequestError(cause, "Não foi possível atualizar as combinações agora."),
        );
      }
    }, MATCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [authenticated, items, loading]);

  const pantryIds = useMemo(
    () => new Set(items.map((item) => item.ingredientId)),
    [items],
  );

  const availableIngredients = useMemo(
    () => ingredients.filter((ingredient) => !pantryIds.has(ingredient.id)),
    [ingredients, pantryIds],
  );

  const rankedAvailable = useMemo(
    () =>
      [...availableIngredients].sort(
        (first, second) =>
          (second.usageCount ?? 0) - (first.usageCount ?? 0) ||
          first.name.localeCompare(second.name, "pt-BR"),
      ),
    [availableIngredients],
  );

  const normalizedQuery = normalizeIngredientName(query);

  const suggestions = useMemo(() => {
    if (!normalizedQuery) return [];

    return rankedAvailable
      .filter((ingredient) =>
        normalizeIngredientName(
          `${ingredient.name} ${ingredient.normalizedName} ${ingredient.category}`,
        ).includes(normalizedQuery),
      )
      .slice(0, 6);
  }, [normalizedQuery, rankedAvailable]);

  const quickIngredients = useMemo(
    () => rankedAvailable.slice(0, 6),
    [rankedAvailable],
  );

  const groupedItems = useMemo(() => {
    const groups = new Map<string, PantryItem[]>();

    items.forEach((item) => {
      const category = item.category || "Outros";
      const current = groups.get(category) ?? [];
      current.push(item);
      groups.set(category, current);
    });

    const categoryOrder = Array.from(
      new Set(ingredients.map((ingredient) => ingredient.category).filter(Boolean)),
    );

    return Array.from(groups.entries()).sort(([first], [second]) => {
      const firstIndex = categoryOrder.indexOf(first);
      const secondIndex = categoryOrder.indexOf(second);
      const safeFirst = firstIndex < 0 ? Number.MAX_SAFE_INTEGER : firstIndex;
      const safeSecond = secondIndex < 0 ? Number.MAX_SAFE_INTEGER : secondIndex;

      return safeFirst - safeSecond || first.localeCompare(second, "pt-BR");
    });
  }, [ingredients, items]);

  function focusSearch() {
    window.requestAnimationFrame(() => searchRef.current?.focus());
  }

  async function addIngredient(ingredient: IngredientOption) {
    if (savingId) return;

    if (pantryIds.has(ingredient.id)) {
      setSearchError(`${ingredient.name} já está na sua despensa.`);
      setSuggestionsOpen(false);
      return;
    }

    const previousItems = items;
    const previousQuery = query;
    const previousExpiry = nextExpiry;
    const expiry = nextExpiry || null;

    setSavingId(ingredient.id);
    setError(null);
    setSearchError("");
    setItems((current) => [optimisticPantryItem(ingredient, expiry), ...current]);
    setQuery("");
    setNextExpiry("");
    setSuggestionsOpen(false);
    setActiveSuggestion(0);

    try {
      setItems(await savePantryItem(ingredient.id, null, null, expiry));
    } catch (cause: unknown) {
      setItems(previousItems);
      setQuery(previousQuery);
      setNextExpiry(previousExpiry);
      setSearchError(
        getRequestError(cause, "Não foi possível adicionar o ingrediente."),
      );
    } finally {
      setSavingId(null);
      focusSearch();
    }
  }

  function findExactIngredient(value: string) {
    const normalizedValue = normalizeIngredientName(value);

    return ingredients.find(
      (ingredient) =>
        normalizeIngredientName(ingredient.name) === normalizedValue ||
        normalizeIngredientName(ingredient.normalizedName) === normalizedValue,
    );
  }

  function submitSearch() {
    if (!normalizedQuery) {
      setSearchError("Digite um ingrediente primeiro.");
      setSuggestionsOpen(false);
      return;
    }

    const exact = findExactIngredient(query);

    if (exact && pantryIds.has(exact.id)) {
      setSearchError(`${exact.name} já está na sua despensa.`);
      setSuggestionsOpen(false);
      return;
    }

    const selected = exact ?? suggestions[activeSuggestion] ?? suggestions[0];

    if (!selected) {
      setSearchError("Não encontramos esse ingrediente. Tente outro nome.");
      setSuggestionsOpen(false);
      return;
    }

    void addIngredient(selected);
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitSearch();
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setSuggestionsOpen(true);
      setActiveSuggestion((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setSuggestionsOpen(true);
      setActiveSuggestion(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );
      return;
    }

    if (event.key === "Escape") {
      setSuggestionsOpen(false);
    }
  }

  function startEditing(item: PantryItem) {
    setEditingId(item.id);
    setEditQuantity(item.quantity === null ? "" : String(item.quantity).replace(".", ","));
    setEditUnit(item.unit ?? "");
    setEditExpiry(item.expiresAt ?? "");
    setItemError("");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditQuantity("");
    setEditUnit("");
    setEditExpiry("");
    setItemError("");
  }

  async function saveItemDetails(item: PantryItem) {
    const raw = editQuantity.trim();
    const parsed = raw ? Number(raw.replace(",", ".")) : null;

    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
      setItemError("Informe uma quantidade válida.");
      return;
    }

    const unit = parsed === null ? null : editUnit || null;
    const expiresAt = editExpiry || null;

    setSavingId(item.ingredientId);
    setItemError("");
    setError(null);

    try {
      setItems(
        await savePantryItem(item.ingredientId, parsed, unit, expiresAt),
      );
      cancelEditing();
    } catch (cause: unknown) {
      setItemError(
        getRequestError(cause, "Não foi possível atualizar o ingrediente."),
      );
    } finally {
      setSavingId(null);
    }
  }

  function showUndo(item: PantryItem) {
    setUndoItem(item);

    if (undoTimer.current !== null) {
      window.clearTimeout(undoTimer.current);
    }

    undoTimer.current = window.setTimeout(() => {
      setUndoItem(null);
      undoTimer.current = null;
    }, 7000);
  }

  async function handleRemove(item: PantryItem) {
    setSavingId(item.ingredientId);
    setError(null);

    try {
      const nextItems = await removePantryItem(item.id);
      setItems(nextItems);
      if (nextItems.length === 0) {
        setMatches([]);
        setMatchStatus("idle");
        setMatchError("");
      }
      if (editingId === item.id) cancelEditing();
      showUndo(item);
    } catch (cause: unknown) {
      setError(
        getRequestError(cause, "Não foi possível remover o ingrediente."),
      );
    } finally {
      setSavingId(null);
    }
  }

  async function undoRemove() {
    if (!undoItem) return;

    const item = undoItem;
    setSavingId(item.ingredientId);
    setError(null);

    try {
      setItems(
        await savePantryItem(
          item.ingredientId,
          item.quantity,
          item.unit,
          item.expiresAt,
        ),
      );
      setUndoItem(null);

      if (undoTimer.current !== null) {
        window.clearTimeout(undoTimer.current);
      }
      undoTimer.current = null;
    } catch (cause: unknown) {
      setError(
        getRequestError(cause, "Não foi possível desfazer a remoção."),
      );
    } finally {
      setSavingId(null);
    }
  }

  const recipeCountCopy =
    recipeCount > 0
      ? `A gente cruza com ${recipeCount} receitas.`
      : "A gente cruza com mais de 280 receitas.";

  if (!authenticated && !loading) {
    return (
      <main className={styles.page}>
        <section className={styles.guest}>
          <div className={styles.guestGrid}>
            <div className={styles.guestIntro}>
              <h1>
                Tudo o que já mora na <span>sua cozinha.</span>
              </h1>
              <p>
                Anote uma vez o que você tem em casa e deixe o Receitando encontrar
                as receitas que combinam com os seus ingredientes.
              </p>

              <ol className={styles.steps}>
                <li>
                  <strong>01</strong>
                  <span>Anote o que tem na geladeira e no armário.</span>
                </li>
                <li>
                  <strong>02</strong>
                  <span>{recipeCountCopy}</span>
                </li>
                <li>
                  <strong>03</strong>
                  <span>Você vê o que dá pra fazer hoje.</span>
                </li>
              </ol>
            </div>

            <section className={styles.loginCard} aria-labelledby="pantry-login-title">
              <div className={styles.lockPreview} aria-hidden="true">
                <div className={styles.previewPills}>
                  {Array.from({ length: 6 }, (_, index) => (
                    <span key={index} />
                  ))}
                </div>
                <span className={styles.lockIcon}>
                  <svg viewBox="0 0 24 24">
                    <rect height="10" rx="2" width="14" x="5" y="11" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                </span>
              </div>

              <h2 id="pantry-login-title">Essa despensa é só sua</h2>
              <p>
                Entre na sua conta para guardar seus ingredientes. Eles ficam salvos e
                alimentam suas combinações.
              </p>
              <Link className={styles.loginButton} href="/entrar?next=/despensa">
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
          <h1>
            Tudo o que já mora na <span>sua cozinha.</span>
          </h1>
          <p className={styles.heroLead}>
            Digite um ingrediente e ele entra direto na despensa. Quantidade só se
            você quiser detalhar depois.
          </p>

          <form
            className={styles.searchForm}
            onSubmit={handleSearchSubmit}
          >
            <span aria-hidden="true" className={styles.plusIcon}>+</span>
            <input
              aria-activedescendant={
                suggestionsOpen && suggestions.length > 0
                  ? `pantry-suggestion-${activeSuggestion}`
                  : undefined
              }
              aria-autocomplete="list"
              aria-controls="pantry-suggestions"
              aria-expanded={suggestionsOpen && suggestions.length > 0}
              aria-label="Buscar ingrediente"
              autoComplete="off"
              id="pantry-search"
              onChange={(event) => {
                setQuery(event.currentTarget.value);
                setSearchError("");
                setActiveSuggestion(0);
                setSuggestionsOpen(Boolean(normalizeIngredientName(event.currentTarget.value)));
              }}
              onFocus={() => {
                if (normalizedQuery && suggestions.length > 0) {
                  setSuggestionsOpen(true);
                }
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Ex.: arroz, ovo, tomate..."
              ref={searchRef}
              role="combobox"
              type="text"
              value={query}
            />
            <button
              className={styles.addButton}
              disabled={Boolean(savingId)}
              type="submit"
            >
              {savingId ? "Salvando…" : "Adicionar"}
            </button>

            {suggestionsOpen && suggestions.length > 0 ? (
              <div
                className={styles.suggestions}
                id="pantry-suggestions"
                role="listbox"
              >
                {suggestions.map((ingredient, index) => (
                  <button
                    aria-selected={index === activeSuggestion}
                    className={styles.suggestion}
                    id={`pantry-suggestion-${index}`}
                    key={ingredient.id}
                    onClick={() => void addIngredient(ingredient)}
                    onMouseEnter={() => setActiveSuggestion(index)}
                    role="option"
                    type="button"
                  >
                    <span>
                      <strong>{ingredient.name}</strong>
                      <small>{ingredient.category}</small>
                    </span>
                    <b>Adicionar</b>
                  </button>
                ))}
              </div>
            ) : null}
          </form>

          <p aria-live="polite" className={styles.searchError}>
            {searchError}
          </p>

          {quickIngredients.length > 0 ? (
            <div className={styles.quickAdd}>
              <span>Adicionar rápido:</span>
              {quickIngredients.map((ingredient) => (
                <button
                  disabled={Boolean(savingId)}
                  key={ingredient.id}
                  onClick={() => void addIngredient(ingredient)}
                  type="button"
                >
                  + {ingredient.name}
                </button>
              ))}
            </div>
          ) : null}

          <div className={styles.nextExpiry}>
            <label htmlFor="pantry-next-expiry">Validade do próximo item <span>(opcional)</span></label>
            <input
              id="pantry-next-expiry"
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setNextExpiry(event.currentTarget.value)}
              type="date"
              value={nextExpiry}
            />
          </div>
        </div>
      </section>

      <section className={styles.itemsArea}>
        <div className={`${styles.container} ${styles.itemsLayout}`}>
          <div className={styles.pantryList}>
            <div className={styles.listHeader}>
              <h2 id="pantry-title">O que já está em casa</h2>
              <span>
                {items.length} {items.length === 1 ? "item" : "itens"}
              </span>
            </div>

            {error ? (
              <p aria-live="polite" className={styles.globalError}>
                {error}
              </p>
            ) : null}

            {loading ? (
              <p className={styles.loadingState}>Carregando sua despensa…</p>
            ) : null}

            {!loading && items.length === 0 ? (
              <div className={styles.emptyState}>
                <strong>Comece com um ingrediente</strong>
                <span>Digite ali em cima e ele entra direto na sua despensa.</span>
              </div>
            ) : null}

            {groupedItems.map(([category, categoryItems]) => (
              <section className={styles.group} key={category}>
                <p className={styles.groupTitle}>
                  {category} · {categoryItems.length}
                </p>

                <ul className={styles.itemGrid}>
                  {categoryItems.map((item) => {
                    const quantity = formatQuantity(item);
                    const expiry = expirationLabel(item.expiresAt);
                    const editing = editingId === item.id;
                    const busy = savingId === item.ingredientId;

                    return (
                      <li
                        aria-busy={busy}
                        className={`${styles.itemCard} ${editing ? styles.editingCard : ""}`}
                        key={item.id}
                      >
                        <p className={styles.itemName}>{item.ingredientName}</p>

                        {editing ? (
                          <>
                            <div className={styles.editControls}>
                              <label>
                                <span>Quantidade</span>
                                <input
                                  aria-label={`Quantidade de ${item.ingredientName}`}
                                  disabled={busy}
                                  inputMode="decimal"
                                  onChange={(event) => {
                                    setEditQuantity(event.currentTarget.value);
                                    setItemError("");
                                  }}
                                  placeholder="Qtd."
                                  value={editQuantity}
                                />
                              </label>

                              <label>
                                <span>Unidade</span>
                                <select
                                  aria-label={`Unidade de ${item.ingredientName}`}
                                  disabled={busy || !editQuantity.trim()}
                                  onChange={(event) => setEditUnit(event.currentTarget.value)}
                                  value={editUnit}
                                >
                                  <option value="">sem unidade</option>
                                  {UNIT_OPTIONS.map((unit) => (
                                    <option key={unit} value={unit}>
                                      {unit}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              <label className={styles.expiryEdit}>
                                <span>Validade</span>
                                <input
                                  aria-label={`Validade de ${item.ingredientName}`}
                                  disabled={busy}
                                  min={new Date().toISOString().slice(0, 10)}
                                  onChange={(event) => setEditExpiry(event.currentTarget.value)}
                                  type="date"
                                  value={editExpiry}
                                />
                              </label>
                            </div>

                            <div className={styles.editActions}>
                              <button
                                className={styles.saveButton}
                                disabled={busy}
                                onClick={() => void saveItemDetails(item)}
                                type="button"
                              >
                                {busy ? "Salvando…" : "Salvar"}
                              </button>
                              <button
                                className={styles.cancelButton}
                                disabled={busy}
                                onClick={cancelEditing}
                                type="button"
                              >
                                Cancelar
                              </button>
                            </div>

                            <p aria-live="polite" className={styles.itemError}>
                              {itemError}
                            </p>
                          </>
                        ) : (
                          <>
                            <button
                              className={`${styles.quantityButton} ${quantity ? "" : styles.quantityEmpty}`}
                              disabled={busy}
                              onClick={() => startEditing(item)}
                              type="button"
                            >
                              {quantity ? (
                                <>
                                  {quantity}
                                  <svg aria-hidden="true" viewBox="0 0 24 24">
                                    <path d="m4 20 4.2-1 10.4-10.4a2 2 0 0 0-2.8-2.8L5.4 16.2 4 20Z" />
                                    <path d="m14.5 7.1 2.8 2.8" />
                                  </svg>
                                </>
                              ) : (
                                "+ quantidade"
                              )}
                            </button>

                            {expiry ? (
                              <small
                                className={
                                  daysUntil(item.expiresAt) !== null &&
                                  (daysUntil(item.expiresAt) ?? 99) <= 1
                                    ? styles.expiryUrgent
                                    : styles.expiryLabel
                                }
                              >
                                {expiry}
                              </small>
                            ) : null}

                            <button
                              aria-label={`Remover ${item.ingredientName}`}
                              className={styles.removeButton}
                              disabled={busy}
                              onClick={() => void handleRemove(item)}
                              type="button"
                            >
                              ×
                            </button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <aside className={styles.recipePanel} aria-labelledby="pantry-recipes-title">
            <h3 id="pantry-recipes-title">Com isso dá pra fazer</h3>
            <p className={styles.recipePanelIntro}>
              A lista muda sempre que a sua despensa muda.
            </p>

            <div aria-live="polite" className={styles.recipeList}>
              {matchStatus === "loading" ? (
                <p className={styles.matchNotice}>Atualizando combinações…</p>
              ) : null}

              {matchStatus === "error" ? (
                <p className={styles.matchNotice}>{matchError}</p>
              ) : null}

              {matchStatus === "idle" && items.length === 0 ? (
                <p className={styles.matchNotice}>
                  Adicione ingredientes para começar a combinar.
                </p>
              ) : null}

              {matchStatus === "ready" && matches.length === 0 ? (
                <p className={styles.matchNotice}>
                  Ainda não apareceu uma combinação. Tente adicionar mais ingredientes.
                </p>
              ) : null}

              {items.length > 0 ? matches.map((recipe) => {
                const missing = recipe.missingIngredients;
                const ready = missing.length === 0;
                const missingText = ready
                  ? "Tudo na bancada"
                  : `Falta: ${missing
                      .slice(0, 3)
                      .map((ingredient) => ingredient.name)
                      .join(", ")}${missing.length > 3 ? "…" : ""}`;

                return (
                  <article className={styles.recipeRow} key={recipe.id}>
                    <div>
                      <Link href={`/receitas/${recipe.slug}`}>{recipe.title}</Link>
                      <p>{missingText}</p>
                    </div>
                    <span className={ready ? styles.readyBadge : styles.missingBadge}>
                      {ready
                        ? "Dá pra fazer"
                        : missing.length === 1
                          ? "Falta 1"
                          : `Faltam ${missing.length}`}
                    </span>
                  </article>
                );
              }) : null}
            </div>

            <Link className={styles.combineButton} href="/combinar">
              Ver combinações
            </Link>
          </aside>
        </div>
      </section>

      {undoItem ? (
        <div className={styles.undoToast} role="status">
          <span>
            <strong>{undoItem.ingredientName}</strong> foi removido.
          </span>
          <button
            disabled={savingId === undoItem.ingredientId}
            onClick={() => void undoRemove()}
            type="button"
          >
            Desfazer
          </button>
        </div>
      ) : null}
    </main>
  );
}
