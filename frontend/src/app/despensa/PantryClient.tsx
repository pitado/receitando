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

function formatAmount(item: PantryItem): string {
  if (item.quantity === null) return "Quantidade não informada";
  return `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`;
}

export function PantryClient() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [ingredientId, setIngredientId] = useState("");
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

  const selectedItem = useMemo(
    () => items.find((item) => item.ingredientId === ingredientId) ?? null,
    [ingredientId, items],
  );

  function handleIngredientChange(nextId: string) {
    setIngredientId(nextId);
    setError(null);

    const existing = items.find((item) => item.ingredientId === nextId);
    if (existing) {
      setQuantity(existing.quantity === null ? "" : String(existing.quantity));
      setUnit(existing.unit ?? "");
      return;
    }

    setQuantity("");
    setUnit("");
  }

  function handleQuantityChange(value: string) {
    setQuantity(value);
    if (!value.trim()) setUnit("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ingredientId) return;

    setSaving(true);
    setError(null);

    const parsedQuantity = quantity.trim() === "" ? null : Number(quantity.replace(",", "."));
    if (parsedQuantity !== null && (!Number.isFinite(parsedQuantity) || parsedQuantity < 0)) {
      setError("Informe uma quantidade válida ou deixe o campo vazio.");
      setSaving(false);
      return;
    }

    try {
      const next = await savePantryItem(
        ingredientId,
        parsedQuantity,
        parsedQuantity === null ? null : unit || null,
      );
      setItems(next);
      setIngredientId("");
      setQuantity("");
      setUnit("");
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível salvar o ingrediente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setError(null);
    try {
      const next = await removePantryItem(id);
      setItems(next);
      const removed = items.find((item) => item.id === id);
      if (removed?.ingredientId === ingredientId) {
        setIngredientId("");
        setQuantity("");
        setUnit("");
      }
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível remover o ingrediente.");
    }
  }

  if (!authenticated && !loading) {
    return (
      <section className={styles.loginState}>
        <p>SUA DESPENSA É PESSOAL</p>
        <h2>Entre para guardar o que você tem em casa.</h2>
        <span>Assim os ingredientes ficam salvos na sua conta e poderão alimentar a busca de receitas.</span>
        <Link href="/entrar">Entrar na minha conta</Link>
      </section>
    );
  }

  return (
    <div className={styles.workspace}>
      <form className={styles.addForm} onSubmit={handleSubmit}>
        <div className={styles.formIntro}>
          <p>{selectedItem ? "ATUALIZAR ITEM" : "ADICIONAR À DESPENSA"}</p>
          <h2>{selectedItem ? "Ajuste o que você já tem" : "O que entrou na cozinha?"}</h2>
          <span>Quantidade e unidade são opcionais. Para encontrar receitas, o ingrediente é o que importa.</span>
        </div>

        <label>
          Ingrediente
          <select value={ingredientId} onChange={(event) => handleIngredientChange(event.target.value)} required>
            <option value="">Selecione um ingrediente</option>
            {ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
            ))}
          </select>
        </label>

        <div className={styles.measureFields}>
          <label>
            Quantidade <small>opcional</small>
            <input
              inputMode="decimal"
              min="0"
              placeholder="Ex.: 2"
              type="number"
              step="any"
              value={quantity}
              onChange={(event) => handleQuantityChange(event.target.value)}
            />
          </label>
          <label>
            Unidade <small>opcional</small>
            <select disabled={!quantity.trim()} value={unit} onChange={(event) => setUnit(event.target.value)}>
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
          </label>
        </div>

        <button disabled={saving || !ingredientId} type="submit">
          {saving ? "Salvando…" : selectedItem ? "Atualizar item" : "Adicionar à despensa"}
        </button>
        {error ? <p className={styles.error}>{error}</p> : null}
      </form>

      <section className={styles.preview} aria-labelledby="pantry-title">
        <div className={styles.previewHeader}>
          <div>
            <p>SUA DESPENSA</p>
            <h2 id="pantry-title">Ingredientes disponíveis</h2>
          </div>
          <span>{items.length} {items.length === 1 ? "item" : "itens"}</span>
        </div>

        {loading ? <p className={styles.notice}>Carregando sua despensa…</p> : null}
        {!loading && items.length === 0 ? (
          <div className={styles.empty}>
            <strong>Sua despensa está vazia.</strong>
            <span>Adicione o primeiro ingrediente no formulário ao lado.</span>
          </div>
        ) : null}

        {items.length > 0 ? (
          <>
            <ul className={styles.items}>
              {items.map((item, index) => (
                <li key={item.id}>
                  <span aria-hidden="true" className={styles.itemNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <button className={styles.itemMain} onClick={() => handleIngredientChange(item.ingredientId)} type="button">
                    <strong>{item.ingredientName}</strong>
                    <span>{item.category}</span>
                  </button>
                  <p>{formatAmount(item)}</p>
                  <button className={styles.remove} onClick={() => void handleRemove(item.id)} type="button">Remover</button>
                </li>
              ))}
            </ul>
            <div className={styles.previewFooter}>
              <div>
                <strong>Sua despensa alimenta o combinador.</strong>
                <span>As quantidades ficam salvas para organização, mas não bloqueiam uma combinação.</span>
              </div>
              <Link href="/receitas">Encontrar receitas</Link>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
