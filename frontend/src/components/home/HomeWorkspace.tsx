"use client";

import { useEffect, useState } from "react";

import { AUTH_CHANGED_EVENT, hasAuthSessionHint } from "@/services/auth-storage";
import { getCurrentUser, type AuthUser } from "@/services/auth.service";
import { getHomeFeed, type HomeFeed } from "@/services/home.service";
import { getPantry, PANTRY_CHANGED_EVENT } from "@/services/pantry.service";
import { matchRecipes } from "@/services/recipes.service";
import type { MatchRecipeResult } from "@/types/recipe";

import { HomeHero } from "./HomeHero";
import { HomeLiveSections } from "./HomeLiveSections";

type LoadState = "idle" | "loading" | "ready" | "error";
const DEFAULT_INGREDIENTS = ["leite", "ovo", "queijo", "polvilho doce", "óleo", "sal"];

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
  // Sem pressupor ingredientes na cozinha de um visitante.
  const [ingredients, setIngredients] = useState<string[]>(DEFAULT_INGREDIENTS);
  const [matches, setMatches] = useState<MatchRecipeResult[]>([]);
  const [matchState, setMatchState] = useState<LoadState>("idle");
  const [matchRetry, setMatchRetry] = useState(0);
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [feedState, setFeedState] = useState<LoadState>("loading");
  const [feedRetry, setFeedRetry] = useState(0);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pantryCount, setPantryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getHomeFeed()
      .then((result) => {
        if (cancelled) return;
        setFeed(result);
        setFeedState("ready");
      })
      .catch(() => {
        if (!cancelled) setFeedState("error");
      });

    return () => { cancelled = true; };
  }, [feedRetry]);

  useEffect(() => {
    let active = true;
    let version = 0;

    async function loadSession() {
      const thisVersion = ++version;
      if (!hasAuthSessionHint()) {
        setUser(null);
        setPantryCount(0);
        setIngredients(DEFAULT_INGREDIENTS);
        return;
      }

      const [accountResult, pantryResult] = await Promise.allSettled([
        getCurrentUser(),
        getPantry(),
      ]);
      if (!active || thisVersion !== version) return;

      if (accountResult.status === "fulfilled") setUser(accountResult.value);
      else setUser(null);

      if (pantryResult.status === "fulfilled") {
        const pantry = pantryResult.value;
        setPantryCount(pantry.length);
        setIngredients(uniqueIngredients(pantry.map((item) => item.ingredientName)));
      }
    }

    void loadSession();
    window.addEventListener(AUTH_CHANGED_EVENT, loadSession);
    window.addEventListener(PANTRY_CHANGED_EVENT, loadSession);
    return () => {
      active = false;
      window.removeEventListener(AUTH_CHANGED_EVENT, loadSession);
      window.removeEventListener(PANTRY_CHANGED_EVENT, loadSession);
    };
  }, []);

  useEffect(() => {
    const selected = uniqueIngredients(ingredients);
    const controller = new AbortController();

    const reset = window.setTimeout(() => {
      setMatches([]);
      setMatchState(selected.length ? "loading" : "idle");
    }, 0);

    const timeout = selected.length ? window.setTimeout(async () => {
      try {
        const result = await matchRecipes(selected, controller.signal);
        if (!controller.signal.aborted) {
          setMatches(sortMatches(result));
          setMatchState("ready");
        }
      } catch {
        if (!controller.signal.aborted) {
          setMatches([]);
          setMatchState("error");
        }
      }
    }, 220) : null;

    return () => {
      window.clearTimeout(reset);
      if (timeout !== null) window.clearTimeout(timeout);
      controller.abort();
    };
  }, [ingredients, matchRetry]);

  function addIngredient(value: string) {
    setIngredients((current) => uniqueIngredients([...current, value]));
  }

  function removeIngredient(value: string) {
    const normalized = value.toLocaleLowerCase("pt-BR");
    setIngredients((current) =>
      current.filter((ingredient) => ingredient.toLocaleLowerCase("pt-BR") !== normalized),
    );
  }

  return (
    <>
      <HomeHero
        ingredients={ingredients}
        matches={matches}
        matchState={matchState}
        onAddIngredient={addIngredient}
        onRemoveIngredient={removeIngredient}
      />
      <HomeLiveSections
        feed={feed}
        feedState={feedState}
        matchState={matchState}
        hasIngredients={ingredients.length > 0}
        matches={matches}
        pantryCount={pantryCount}
        user={user}
        onAddIngredient={addIngredient}
        onRetryFeed={() => { setFeedState("loading"); setFeedRetry((value) => value + 1); }}
        onRetryMatch={() => setMatchRetry((value) => value + 1)}
      />
    </>
  );
}
