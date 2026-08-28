"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { formatIngredientAmount } from "@/lib/format";
import { hasAuthSessionHint } from "@/services/auth-storage";
import { getPantry, type PantryItem } from "@/services/pantry.service";
import type { RecipeIngredient } from "@/types/recipe";

import styles from "./RecipeShoppingList.module.css";

interface RecipeShoppingListProps {
  ingredients: RecipeIngredient[];
}

export function RecipeShoppingList({ ingredients }: RecipeShoppingListProps) {
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [authenticated] = useState(() => hasAuthSessionHint());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!authenticated) {
        setLoading(false);
        return;
      }

      try {
        const items = await getPantry();
        if (!cancelled) setPantry(items);
      } catch {
        if (!cancelled) setError("Não foi possível comparar esta receita com sua despensa agora.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [authenticated]);

  const missing = useMemo(() => {
    const pantryIds = new Set(pantry.map((item) => item.ingredientId));
    return ingredients.filter(
      (ingredient) => !ingredient.optional && !ingredient.isStaple && !pantryIds.has(ingredient.ingredientId),
    );
  }, [ingredients, pantry]);

  async function copyList() {
    const text = missing
      .map((ingredient) => {
        const amount = formatIngredientAmount(ingredient.quantity, ingredient.unit);
        return `• ${ingredient.name}${amount ? ` — ${amount}` : ""}`;
      })
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Não foi possível copiar a lista automaticamente.");
    }
  }

  if (!authenticated && !loading) {
    return (
      <section className={styles.shell} aria-labelledby="shopping-list-title">
        <div>
          <p className={styles.eyebrow}>Lista de compras</p>
          <h2 id="shopping-list-title">Leve só o que está faltando.</h2>
          <p>Entre na sua conta para cruzar a receita com a sua despensa e montar a lista automaticamente.</p>
        </div>
        <Link href="/entrar">Entrar para gerar minha lista</Link>
      </section>
    );
  }

  return (
    <section className={styles.shell} aria-labelledby="shopping-list-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Lista de compras automática</p>
          <h2 id="shopping-list-title">Só o que falta para esta receita.</h2>
          <p>A lista cruza os ingredientes obrigatórios com a sua despensa. Itens básicos e opcionais ficam de fora.</p>
        </div>
        {!loading ? <span>{missing.length} {missing.length === 1 ? "item" : "itens"}</span> : null}
      </div>

      {loading ? <p className={styles.notice}>Comparando com a sua despensa…</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      {!loading && !error && missing.length === 0 ? (
        <div className={styles.complete}>
          <strong>Você já tem os ingredientes obrigatórios desta receita.</strong>
          <span>Boa hora para cozinhar sem precisar passar no mercado.</span>
        </div>
      ) : null}

      {!loading && missing.length > 0 ? (
        <>
          <ul className={styles.list}>
            {missing.map((ingredient) => {
              const amount = formatIngredientAmount(ingredient.quantity, ingredient.unit);
              return (
                <li key={ingredient.ingredientId}>
                  <span aria-hidden="true">□</span>
                  <div>
                    <strong>{ingredient.name}</strong>
                    <small>{ingredient.rawText || amount || "quantidade não informada"}</small>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className={styles.footer}>
            <small>A versão atual compara presença do ingrediente; quantidade disponível na despensa ainda não reduz esta lista.</small>
            <button onClick={() => void copyList()} type="button">
              {copied ? "Lista copiada ✓" : "Copiar lista de compras"}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}
