"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { ApiError } from "@/services/api-client";
import { getAuthToken } from "@/services/auth-storage";
import {
  getIngredients,
  getPantry,
  IngredientOption,
  PantryItem,
  removePantryItem,
  savePantryItem,
} from "@/services/pantry.service";

import styles from "./page.module.css";

const popularNames = ["ovo", "leite", "arroz", "cebola", "alho", "tomate", "batata", "farinha de trigo"];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatAmount(item: PantryItem): string | null {
  if (item.quantity === null) return null;
  return `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`;
}

export function PantryClient() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated] = useState(() => Boolean(getAuthToken()));

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
        if (!cancelled) setError(cause instanceof ApiError ? cause.message : "Não foi possível carregar sua despensa.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPantry();
    return () => { cancelled = true; };
  }, [authenticated]);

  const usedIds = useMemo(() => new Set(items.map((item) => item.ingredientId)), [items]);

  const suggestions = useMemo(() => {
    const search = normalize(query);
    if (!search) return [];
    return ingredients
      .filter((ingredient) => !usedIds.has(ingredient.id))
      .filter((ingredient) => normalize(`${ingredient.name} ${ingredient.category}`).includes(search))
      .slice(0, 8);
  }, [ingredients, query, usedIds]);

  const popular = useMemo(() => {
    const byName = new Map(ingredients.map((ingredient) => [normalize(ingredient.name), ingredient]));
    return popularNames
      .map((name) => byName.get(name))
      .filter((ingredient): ingredient is IngredientOption => Boolean(ingredient && !usedIds.has(ingredient.id)))
      .slice(0, 6);
  }, [ingredients, usedIds]);

  async function addIngredient(ingredient: IngredientOption) {
    setSaving(true);
    setError(null);
    try {
      setItems(await savePantryItem(ingredient.id, null, null));
      setQuery("");
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível adicionar o ingrediente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return;

    const exact = suggestions.find((ingredient) => normalize(ingredient.name) === normalize(query));
    const chosen = exact ?? suggestions[0];
    if (!chosen) {
      setError("Não encontramos esse ingrediente. Tente outro nome.");
      return;
    }
    await addIngredient(chosen);
  }

  function startEditing(item: PantryItem) {
    setEditingId(item.id);
    setQuantity(item.quantity === null ? "" : String(item.quantity));
    setUnit(item.unit ?? "");
    setError(null);
  }

  function cancelEditing() {
    setEditingId(null);
    setQuantity("");
    setUnit("");
  }

  async function saveDetails(item: PantryItem) {
    const parsed = quantity.trim() ? Number(quantity.replace(",", ".")) : null;
    if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
      setError("Informe uma quantidade válida.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      setItems(await savePantryItem(item.ingredientId, parsed, parsed === null ? null : unit || null));
      cancelEditing();
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível atualizar o ingrediente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setError(null);
    try {
      setItems(await removePantryItem(id));
      if (editingId === id) cancelEditing();
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível remover o ingrediente.");
    }
  }

  if (!authenticated && !loading) {
    return (
      <section className={styles.loginState}>
        <p>SUA DESPENSA É PESSOAL</p>
        <h2>Entre para guardar o que você tem em casa.</h2>
        <span>Assim os ingredientes ficam salvos na sua conta e alimentam suas combinações.</span>
        <Link href="/entrar">Entrar na minha conta</Link>
      </section>
    );
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.quickAdd}>
        <div className={styles.quickIntro}>
          <p>ADICIONE EM SEGUNDOS</p>
          <h2>O que você tem em casa?</h2>
          <span>Digite um ingrediente e adicione. Quantidade só entra se você quiser detalhar depois.</span>
        </div>

        <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
          <div className={styles.searchBox}>
            <span aria-hidden="true">+</span>
            <input
              aria-label="Buscar ingrediente"
              autoComplete="off"
              disabled={saving}
              onChange={(event) => { setQuery(event.target.value); setError(null); }}
              placeholder="Ex.: arroz, ovo, tomate..."
              value={query}
            />
          </div>

          {suggestions.length > 0 ? (
            <div className={styles.suggestions}>
              {suggestions.map((ingredient) => (
                <button key={ingredient.id} onClick={() => void addIngredient(ingredient)} type="button">
                  <strong>{ingredient.name}</strong>
                  <span>{ingredient.category}</span>
                  <b>Adicionar</b>
                </button>
              ))}
            </div>
          ) : null}
        </form>

        {popular.length > 0 && !query ? (
          <div className={styles.quickPicks}>
            <span>Adicionar rápido:</span>
            {popular.map((ingredient) => (
              <button disabled={saving} key={ingredient.id} onClick={() => void addIngredient(ingredient)} type="button">
                + {ingredient.name}
              </button>
            ))}
          </div>
        ) : null}

        {error ? <p className={styles.error}>{error}</p> : null}
      </section>

      <section className={styles.preview} aria-labelledby="pantry-title">
        <div className={styles.previewHeader}>
          <div>
            <p>SUA DESPENSA</p>
            <h2 id="pantry-title">O que já está em casa</h2>
          </div>
          <span>{items.length} {items.length === 1 ? "item" : "itens"}</span>
        </div>

        {loading ? <p className={styles.notice}>Carregando sua despensa…</p> : null}
        {!loading && items.length === 0 ? (
          <div className={styles.empty}>
            <strong>Comece com um ingrediente.</strong>
            <span>Digite acima e ele entra direto na sua despensa.</span>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className={styles.itemGrid}>
            {items.map((item) => {
              const amount = formatAmount(item);
              const editing = editingId === item.id;
              return (
                <article className={styles.itemCard} key={item.id}>
                  <div className={styles.itemTop}>
                    <div>
                      <strong>{item.ingredientName}</strong>
                      <span>{item.category}</span>
                    </div>
                    <button className={styles.remove} onClick={() => void handleRemove(item.id)} type="button" aria-label={`Remover ${item.ingredientName}`}>×</button>
                  </div>

                  {editing ? (
                    <div className={styles.inlineEditor}>
                      <input
                        inputMode="decimal"
                        min="0"
                        onChange={(event) => setQuantity(event.target.value)}
                        placeholder="Quantidade"
                        step="any"
                        type="number"
                        value={quantity}
                      />
                      <select disabled={!quantity.trim()} onChange={(event) => setUnit(event.target.value)} value={unit}>
                        <option value="">sem unidade</option>
                        <option value="unidade">unidade</option>
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="l">litro</option>
                        <option value="xícara">xícara</option>
                        <option value="colher de sopa">colher de sopa</option>
                        <option value="colher de chá">colher de chá</option>
                      </select>
                      <div>
                        <button disabled={saving} onClick={() => void saveDetails(item)} type="button">Salvar</button>
                        <button onClick={cancelEditing} type="button">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <button className={styles.amountButton} onClick={() => startEditing(item)} type="button">
                      {amount ? <><b>{amount}</b><span>Editar quantidade</span></> : <><b>Sem quantidade</b><span>Adicionar detalhe</span></>}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className={styles.previewFooter}>
            <div>
              <strong>{items.length} ingredientes prontos para combinar</strong>
              <span>O combinador considera o que você tem; quantidade é só um detalhe opcional.</span>
            </div>
            <Link href="/combinar">Combinar agora →</Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
