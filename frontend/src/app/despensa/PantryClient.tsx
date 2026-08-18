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

export function PantryClient() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("unidade");
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

  const availableIngredients = useMemo(() => {
    const used = new Set(items.map((item) => item.ingredientId));
    return ingredients.filter((ingredient) => !used.has(ingredient.id) || ingredient.id === ingredientId);
  }, [ingredientId, ingredients, items]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ingredientId) return;
    setSaving(true);
    setError(null);
    const parsedQuantity = quantity.trim() === "" ? null : Number(quantity.replace(",", "."));

    try {
      const next = await savePantryItem(
        ingredientId,
        parsedQuantity !== null && Number.isFinite(parsedQuantity) ? parsedQuantity : null,
        unit,
      );
      setItems(next);
      setIngredientId("");
      setQuantity("");
      setUnit("unidade");
    } catch (cause: unknown) {
      setError(cause instanceof ApiError ? cause.message : "Não foi possível salvar o ingrediente.");
    } finally {
      setSaving(false);
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
        <span>Assim os ingredientes ficam salvos na sua conta e poderão alimentar a busca de receitas.</span>
        <Link href="/entrar">Entrar na minha conta</Link>
      </section>
    );
  }

  return (
    <div className={styles.workspace}>
      <form className={styles.addForm} onSubmit={handleSubmit}>
        <div className={styles.formIntro}>
          <p>ADICIONAR À DESPENSA</p>
          <h2>O que entrou na cozinha?</h2>
        </div>
        <label>
          Ingrediente
          <select value={ingredientId} onChange={(event) => setIngredientId(event.target.value)} required>
            <option value="">Selecione</option>
            {availableIngredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>{ingredient.name}</option>
            ))}
          </select>
        </label>
        <label>
          Quantidade
          <input inputMode="decimal" placeholder="Ex.: 6" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </label>
        <label>
          Unidade
          <select value={unit} onChange={(event) => setUnit(event.target.value)}>
            <option value="unidade">unidade</option>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="l">litro</option>
            <option value="xícara">xícara</option>
            <option value="colher">colher</option>
          </select>
        </label>
        <button disabled={saving || !ingredientId} type="submit">{saving ? "Salvando…" : "Adicionar"}</button>
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
          <ul className={styles.items}>
            {items.map((item, index) => (
              <li key={item.id}>
                <span aria-hidden="true" className={styles.itemNumber}>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{item.ingredientName}</strong>
                  <span>{item.category}</span>
                </div>
                <p>{item.quantity ?? "—"} {item.unit ?? ""}</p>
                <button className={styles.remove} onClick={() => void handleRemove(item.id)} type="button">Remover</button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
