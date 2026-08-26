"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { normalizeIngredientName } from "@/lib/normalize-ingredient";
import { ApiError } from "@/services/api-client";
import { hasAuthSessionHint } from "@/services/auth-storage";
import {
  getIngredients,
  getPantry,
  IngredientOption,
  PantryItem,
  removePantryItem,
  savePantryItem,
} from "@/services/pantry.service";

import styles from "./page.module.css";

export function PantryClient() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authenticated] = useState(() => hasAuthSessionHint());

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
          setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar sua despensa.");
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

  const pantryIds = useMemo(() => new Set(items.map((item) => item.ingredientId)), [items]);
  const availableIngredients = useMemo(
    () => ingredients.filter((ingredient) => !pantryIds.has(ingredient.id)),
    [ingredients, pantryIds],
  );

  const normalizedQuery = normalizeIngredientName(query);
  const suggestions = useMemo(() => {
    const ranked = [...availableIngredients].sort(
      (first, second) =>
        (second.usageCount ?? 0) - (first.usageCount ?? 0) ||
        first.name.localeCompare(second.name, "pt-BR"),
    );

    if (!normalizedQuery) return ranked.slice(0, 8);

    return ranked
      .filter((ingredient) =>
        normalizeIngredientName(`${ingredient.name} ${ingredient.normalizedName}`).includes(normalizedQuery),
      )
      .slice(0, 10);
  }, [availableIngredients, normalizedQuery]);

  async function addIngredient(ingredient: IngredientOption) {
    setSavingId(ingredient.id);
    setError(null);
    try {
      setItems(await savePantryItem(ingredient.id, null, null));
      setQuery("");
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível adicionar o ingrediente.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleRemove(id: string) {
    setError(null);
    try {
      setItems(await removePantryItem(id));
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível remover o ingrediente.");
    }
  }

  if (!authenticated && !loading) {
    return (
      <section className={styles.loginState}>
        <p>SUA DESPENSA É PESSOAL</p>
        <h2>Entre para guardar o que você tem em casa.</h2>
        <span>Assim os ingredientes ficam salvos na sua conta e alimentam o combinador de receitas.</span>
        <Link href="/entrar">Entrar na minha conta</Link>
      </section>
    );
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.addPanel} aria-labelledby="add-pantry-title">
        <div className={styles.formIntro}>
          <p>ADICIONE EM SEGUNDOS</p>
          <h2 id="add-pantry-title">O que você tem em casa?</h2>
          <span>Digite um ingrediente e toque para adicionar. Sem formulário, sem quantidade obrigatória.</span>
        </div>

        <div className={styles.searchBox}>
          <label htmlFor="pantry-search">Buscar ingrediente</label>
          <input
            autoComplete="off"
            id="pantry-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: arroz, tomate, leite..."
            type="search"
            value={query}
          />
        </div>

        <div className={styles.suggestionBlock}>
          <div className={styles.suggestionHeading}>
            <strong>{query ? "Resultados" : "Sugestões para sua despensa"}</strong>
            {!query ? <span>mais usados nas receitas</span> : null}
          </div>

          {suggestions.length > 0 ? (
            <div className={styles.suggestions}>
              {suggestions.map((ingredient) => (
                <button
                  disabled={savingId !== null}
                  key={ingredient.id}
                  onClick={() => void addIngredient(ingredient)}
                  type="button"
                >
                  <span>+</span>
                  <strong>{ingredient.name}</strong>
                  <small>{ingredient.category}</small>
                </button>
              ))}
            </div>
          ) : (
            <p className={styles.noResults}>Nenhum ingrediente do catálogo corresponde a essa busca.</p>
          )}
        </div>

        {savingId ? <p className={styles.saving}>Adicionando à sua despensa…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
      </section>

      <section className={styles.preview} aria-labelledby="pantry-title">
        <div className={styles.previewHeader}>
          <div>
            <p>SUA DESPENSA</p>
            <h2 id="pantry-title">O que já está disponível</h2>
          </div>
          <span>{items.length} {items.length === 1 ? "ingrediente" : "ingredientes"}</span>
        </div>

        {loading ? <p className={styles.notice}>Carregando sua despensa…</p> : null}
        {!loading && items.length === 0 ? (
          <div className={styles.empty}>
            <strong>Sua despensa ainda está vazia.</strong>
            <span>Use a busca ao lado e adicione os ingredientes que você realmente tem.</span>
          </div>
        ) : null}

        {items.length > 0 ? (
          <>
            <ul className={styles.items}>
              {items.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.ingredientName}</strong>
                    <span>{item.category}</span>
                  </div>
                  {item.quantity !== null ? (
                    <small className={styles.amount}>{item.quantity}{item.unit ? ` ${item.unit}` : ""}</small>
                  ) : null}
                  <button className={styles.remove} onClick={() => void handleRemove(item.id)} type="button" aria-label={`Remover ${item.ingredientName}`}>
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className={styles.previewFooter}>
              <div>
                <strong>Pronto para combinar.</strong>
                <span>O Receitando usa esses ingredientes para ordenar as receitas que mais combinam com sua cozinha.</span>
              </div>
              <Link href="/combinar">Ver combinações</Link>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
