"use client";

import { useEffect, useState } from "react";

import { AUTH_CHANGED_EVENT, hasAuthSessionHint } from "@/services/auth-storage";
import { getCurrentUser, type AuthUser } from "@/services/auth.service";
import { getHomeFeed, type HomeFeed } from "@/services/home.service";
import { getPantry } from "@/services/pantry.service";
import { matchRecipes } from "@/services/recipes.service";
import type { MatchRecipeResult } from "@/types/recipe";

import { HomeHero } from "./HomeHero";
import { HomeLiveSections } from "./HomeLiveSections";

const DEFAULT_INGREDIENTS = ["arroz", "ovo", "tomate"];

function uniqueIngredients(values: string[]) {
  const seen = new Set<string>();
  return values
    .map((value) => value.trim())
    .filter((value) => {
      const normalized = value.toLocaleLowerCase("pt-BR");
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .slice(0, 30);
}

function sortMatches(items: MatchRecipeResult[]) {
  return [...items].sort((a, b) => {
    const missingDifference = a.missingIngredients.length - b.missingIngredients.length;
    if (missingDifference !== 0) return missingDifference;
    return b.compatibility - a.compatibility;
  });
}

export function HomeWorkspace() {
  const [ingredients, setIngredients] = useState<string[]>(DEFAULT_INGREDIENTS);
  const [matches, setMatches] = useState<MatchRecipeResult[]>([]);
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pantryCount, setPantryCount] = useState(0);
  const [loadingMatches, setLoadingMatches] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadHome() {
      const feedResult = await Promise.allSettled([getHomeFeed()]);
      if (!cancelled && feedResult[0].status === "fulfilled") setFeed(feedResult[0].value);

      if (!hasAuthSessionHint()) return;

      const accountResult = await Promise.allSettled([getCurrentUser(), getPantry()]);
      if (cancelled) return;

      if (accountResult[0].status === "fulfilled") setUser(accountResult[0].value);

      if (accountResult[1].status === "fulfilled") {
        const pantry = accountResult[1].value;
        setPantryCount(pantry.length);
        setIngredients(uniqueIngredients(pantry.map((item) => item.ingredientName)));
      }
    }

    void loadHome();

    function handleAuthChange() {
      if (!hasAuthSessionHint()) {
        setUser(null);
        setPantryCount(0);
        setIngredients(DEFAULT_INGREDIENTS);
        return;
      }
      void loadHome();
    }

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);

    return () => {
      cancelled = true;
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const selected = uniqueIngredients(ingredients);
    if (selected.length === 0) {
      setMatches([]);
      setLoadingMatches(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoadingMatches(true);
      try {
        const result = await matchRecipes(selected, controller.signal);
        if (!controller.signal.aborted) setMatches(sortMatches(result));
      } catch {
        if (!controller.signal.aborted) setMatches([]);
      } finally {
        if (!controller.signal.aborted) setLoadingMatches(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [ingredients]);

  function addIngredient(value: string) {
    const next = uniqueIngredients([...ingredients, value]);
    setIngredients(next);
  }

  function removeIngredient(value: string) {
    const normalized = value.toLocaleLowerCase("pt-BR");
    setIngredients(ingredients.filter((ingredient) => ingredient.toLocaleLowerCase("pt-BR") !== normalized));
  }

  return (
    <>
      <HomeHero
        ingredients={ingredients}
        loadingMatches={loadingMatches}
        matches={matches}
        onAddIngredient={addIngredient}
        onRemoveIngredient={removeIngredient}
      />
      <HomeLiveSections
        feed={feed}
        ingredients={ingredients}
        matches={matches}
        pantryCount={pantryCount}
        user={user}
        onAddIngredient={addIngredient}
      />
    </>
  );
}
