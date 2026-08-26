"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { addFavorite, listFavorites, removeFavorite } from "@/services/favorites.service";
import { AUTH_CHANGED_EVENT, hasAuthSessionHint } from "@/services/auth-storage";

import styles from "./FavoriteButton.module.css";

interface FavoriteButtonProps {
  initialFavorite?: boolean;
  label?: boolean;
  onChange?: (favorite: boolean) => void;
  recipeId: string;
  syncFavorite?: boolean;
}

export function FavoriteButton({
  initialFavorite = false,
  label = true,
  onChange,
  recipeId,
  syncFavorite = true,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(() => hasAuthSessionHint());
  const [favorite, setFavorite] = useState(initialFavorite);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authenticated && syncFavorite) {
      listFavorites()
        .then((recipes) => setFavorite(recipes.some((recipe) => recipe.id === recipeId)))
        .catch(() => undefined);
    }

    function handleAuthChange() {
      const nextAuthenticated = hasAuthSessionHint();
      setAuthenticated(nextAuthenticated);
      if (!nextAuthenticated) {
        setFavorite(false);
        return;
      }
      if (syncFavorite) {
        listFavorites()
          .then((recipes) => setFavorite(recipes.some((recipe) => recipe.id === recipeId)))
          .catch(() => undefined);
      }
    }

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
  }, [authenticated, recipeId, syncFavorite]);

  async function toggleFavorite() {
    if (!authenticated) {
      router.push("/entrar");
      return;
    }

    setSaving(true);
    try {
      if (favorite) await removeFavorite(recipeId);
      else await addFavorite(recipeId);

      const next = !favorite;
      setFavorite(next);
      onChange?.(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      aria-label={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={favorite}
      className={`${styles.button} ${favorite ? styles.active : ""}`}
      disabled={saving}
      onClick={() => void toggleFavorite()}
      type="button"
    >
      <span aria-hidden="true">{favorite ? "♥" : "♡"}</span>
      {label ? <span>{favorite ? "Salva" : "Salvar"}</span> : null}
    </button>
  );
}
