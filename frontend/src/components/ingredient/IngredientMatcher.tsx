"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { IngredientChip } from "@/components/ingredient/IngredientChip";
import { IngredientInput } from "@/components/ingredient/IngredientInput";
import { MatchResultRow } from "@/components/ingredient/MatchResultRow";
import { normalizeIngredientName } from "@/lib/normalize-ingredient";
import { ApiError } from "@/services/api-client";
import { hasAuthSessionHint } from "@/services/auth-storage";
import { getPantry, type PantryItem } from "@/services/pantry.service";
import { matchRecipes, matchRecipesFromPantry } from "@/services/recipes.service";
import type { MatchRecipeResult } from "@/types/recipe";

import styles from "./IngredientMatcher.module.css";

type MatcherStatus = "idle" | "loading" | "success" | "error";
type ResultMode = "manual" | "pantry" | null;

type IngredientMatcherProps = {
  initialIngredients?: string[];
  previewLimit?: number;
};

const suggestions = ["ovo", "banana", "farinha de trigo", "leite"];
const DAY_MS = 24 * 60 * 60 * 1000;

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.kind === "connection") {
    return "Não foi possível buscar receitas agora. Verifique se a API está ligada e tente novamente.";
  }

  if (error instanceof ApiError && error.status === 400) {
    return "Não conseguimos entender essa lista de ingredientes. Revise os itens e tente novamente.";
  }

  return "Não foi possível buscar receitas agora. Tente novamente.";
}

function daysUntil(dateValue: string | null): number | null {
  if (!dateValue) return null;
  const [year, month, day] = dateValue.split("-").map(Number);
  if (!year || !month || !day) return null;

  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((Date.UTC(year, month - 1, day) - todayUtc) / DAY_MS);
}

function urgencyWeight(days: number | null): number {
  if (days === null || days > 7) return 0;
  if (days <= 0) return 5;
  if (days === 1) return 4;
  if (days <= 3) return 3;
  return 1;
}

function rankPantryMatches(matches: MatchRecipeResult[], pantry: PantryItem[]): MatchRecipeResult[] {
  const expiryByIngredient = new Map(
    pantry.map((item) => [item.ingredientId, daysUntil(item.expiresAt)]),
  );

  function recipeUrgency(recipe: MatchRecipeResult): number {
    return recipe.foundIngredients.reduce(
      (score, ingredient) => score + urgencyWeight(expiryByIngredient.get(ingredient.id) ?? null),
      0,
    );
  }

  return [...matches].sort((first, second) => {
    const compatibilityGap = Math.abs(first.compatibility - second.compatibility);
    if (compatibilityGap > 5) return second.compatibility - first.compatibility;

    const urgencyGap = recipeUrgency(second) - recipeUrgency(first);
    if (urgencyGap !== 0) return urgencyGap;

    return (
      second.compatibility - first.compatibility ||
      first.missingIngredients.length - second.missingIngredients.length ||
      first.prepMinutes - second.prepMinutes ||
      first.title.localeCompare(second.title, "pt-BR")
    );
  });
}

function joinIngredientNames(names: string[]): string {
  if (names.length === 0) return "seus ingredientes";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;
}

export function IngredientMatcher({
  initialIngredients = [],
  previewLimit,
}: IngredientMatcherProps) {
  const [ingredients, setIngredients] = useState<string[]>(initialIngredients);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [results, setResults] = useState<MatchRecipeResult[]>([]);
  const [resultMode, setResultMode] = useState<ResultMode>(null);
  const [status, setStatus] = useState<MatcherStatus>("idle");
  const [requestError, setRequestError] = useState("");
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [pantryAuthError, setPantryAuthError] = useState(false);
  const [authenticated] = useState(() => hasAuthSessionHint());
  const activeRequest = useRef<AbortController | null>(null);

  function resetResults() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setResults([]);
    setResultMode(null);
    setRequestError("");
    setStatus("idle");
    setPantryItems([]);
    setPantryAuthError(false);
  }

  function addIngredient(rawValue: string): boolean {
    const normalizedValue = normalizeIngredientName(rawValue);

    if (!normalizedValue) {
      setFieldError("Digite um ingrediente antes de adicionar.");
      return false;
    }

    if (
      ingredients.some(
        (ingredient) => normalizeIngredientName(ingredient) === normalizedValue,
      )
    ) {
      setFieldError("Esse ingrediente já está na sua lista.");
      return false;
    }

    setIngredients((current) => [...current, rawValue.trim().replace(/\s+/g, " ")]);
    setFieldError(null);
    resetResults();
    return true;
  }

  function removeIngredient(name: string) {
    setIngredients((current) => current.filter((ingredient) => ingredient !== name));
    setFieldError(null);
    resetResults();
  }

  async function findRecipes() {
    if (ingredients.length === 0) {
      setFieldError("Adicione pelo menos um ingrediente para buscar receitas.");
      return;
    }

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setFieldError(null);
    setRequestError("");
    setPantryAuthError(false);
    setPantryItems([]);
    setStatus("loading");

    try {
      const matches = await matchRecipes(ingredients, controller.signal);

      if (activeRequest.current !== controller) return;

      setResults(matches);
      setResultMode("manual");
      setStatus("success");
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      if (activeRequest.current === controller) {
        setRequestError(getErrorMessage(error));
        setStatus("error");
      }
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }

  async function findRecipesFromPantry() {
    if (!hasAuthSessionHint()) {
      setRequestError("Entre na sua conta para combinar receitas com a despensa e considerar as validades.");
      setPantryAuthError(true);
      setStatus("error");
      return;
    }

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setFieldError(null);
    setRequestError("");
    setPantryAuthError(false);
    setStatus("loading");

    try {
      const [matches, pantry] = await Promise.all([
        matchRecipesFromPantry(controller.signal),
        getPantry(),
      ]);

      if (activeRequest.current !== controller) return;

      setPantryItems(pantry);
      setResults(rankPantryMatches(matches, pantry));
      setResultMode("pantry");
      setStatus("success");
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") return;

      if (activeRequest.current === controller) {
        setRequestError(getErrorMessage(error));
        setStatus("error");
      }
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }

  const isLoading = status === "loading";
  const visibleResults = previewLimit ? results.slice(0, previewLimit) : results;
  const hasMoreResults = Boolean(previewLimit && results.length > previewLimit);
  const combineHref = `/combinar?ingredientes=${encodeURIComponent(ingredients.join(","))}`;

  const summaryIngredients =
    resultMode === "pantry"
      ? "o que está na sua despensa"
      : (() => {
          const visibleIngredients = ingredients.slice(0, 3);
          const base = joinIngredientNames(visibleIngredients);
          const extraCount = Math.max(0, ingredients.length - visibleIngredients.length);
          return extraCount > 0 ? `${base} e mais ${extraCount}` : base;
        })();

  const readyCount = results.filter((recipe) => recipe.compatibility === 100).length;
  const firstResult = results[0];
  const nearestMissingCount = firstResult?.missingIngredients.length ?? 0;

  const expiryByIngredient = new Map(
    pantryItems.map((item) => [item.ingredientId, daysUntil(item.expiresAt)]),
  );

  function urgentIngredientNames(recipe: MatchRecipeResult): string[] {
    if (resultMode !== "pantry") return [];

    return recipe.foundIngredients
      .filter(
        (ingredient) =>
          urgencyWeight(expiryByIngredient.get(ingredient.id) ?? null) >= 3,
      )
      .map((ingredient) => ingredient.name);
  }

  return (
    <div className={styles.matcher}>
      <aside className={styles.panel} aria-labelledby="bench-title">
        <div className={styles.panelHeading}>
          <h2 id="bench-title">Sua bancada</h2>
          <span>
            {ingredients.length} {ingredients.length === 1 ? "item" : "itens"}
          </span>
        </div>

        <IngredientInput
          disabled={isLoading}
          error={fieldError}
          onAdd={addIngredient}
          onValueChange={() => setFieldError(null)}
        />

        <div className={styles.suggestions}>
          <span>Experimente:</span>
          {suggestions.map((suggestion) => {
            const alreadyAdded = ingredients.some(
              (ingredient) =>
                normalizeIngredientName(ingredient) ===
                normalizeIngredientName(suggestion),
            );

            return (
              <button
                className={styles.suggestion}
                disabled={alreadyAdded || isLoading}
                key={suggestion}
                onClick={() => addIngredient(suggestion)}
                type="button"
              >
                + {suggestion}
              </button>
            );
          })}
        </div>

        <div className={styles.listBlock}>
          {ingredients.length > 0 ? (
            <div aria-label="Ingredientes adicionados" className={styles.chips}>
              {ingredients.map((ingredient) => (
                <IngredientChip
                  disabled={isLoading}
                  key={ingredient}
                  name={ingredient}
                  onRemove={() => removeIngredient(ingredient)}
                />
              ))}
            </div>
          ) : (
            <p className={styles.noIngredients}>
              Sua lista ainda está vazia. Adicione um item acima ou use sua despensa.
            </p>
          )}
        </div>

        <button
          className={styles.findButton}
          disabled={isLoading}
          onClick={() => void findRecipes()}
          type="button"
        >
          {isLoading ? "Comparando ingredientes…" : "Encontrar receitas"}
        </button>

        <div className={styles.divider}>
          <span>ou</span>
        </div>

        <button
          className={`${styles.pantryButton} ${authenticated ? "" : styles.pantryButtonLocked}`}
          disabled={isLoading}
          onClick={() => void findRecipesFromPantry()}
          type="button"
        >
          <span className={styles.pantryIcon} aria-hidden="true">
            {authenticated ? (
              <svg viewBox="0 0 24 24">
                <rect height="18" rx="2" width="12" x="6" y="3" />
                <path d="M6 11h12M9 7h1M9 15h1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <rect height="10" rx="2" width="14" x="5" y="11" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            )}
          </span>
          <span>
            <strong>Usar minha despensa</strong>
            <small>
              {authenticated
                ? "Combina com os itens que você guardou e prioriza o que vence antes."
                : "Entre na sua conta para combinar com o que você guardou e considerar as validades."}
            </small>
          </span>
        </button>
      </aside>

      <section
        aria-busy={isLoading}
        aria-live="polite"
        className={styles.results}
      >
        {status === "idle" ? (
          <div className={styles.stateCard}>
            <span className={styles.stateBubble} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M8 3h8M9 3v4l-5 8.5A3.7 3.7 0 0 0 7.2 21h9.6a3.7 3.7 0 0 0 3.2-5.5L15 7V3" />
                <path d="M7 14h10" />
              </svg>
            </span>
            <h3>As melhores combinações aparecem aqui</h3>
            <p>
              A compatibilidade considera os ingredientes obrigatórios. Com a despensa, o que vence antes também ganha prioridade.
            </p>
          </div>
        ) : null}

        {status === "loading" ? (
          <div className={styles.stateCard} role="status">
            <span className={styles.spinner} aria-hidden="true" />
            <h3>Comparando sua lista</h3>
            <p>Comparando sua lista com as receitas…</p>
          </div>
        ) : null}

        {status === "error" && pantryAuthError ? (
          <div className={`${styles.stateCard} ${styles.solidState}`}>
            <span className={`${styles.stateBubble} ${styles.darkBubble}`} aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect height="10" rx="2" width="14" x="5" y="11" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <h3>Essa despensa é só sua</h3>
            <p>{requestError}</p>
            <div className={styles.authActions}>
              <Link className={styles.darkLinkButton} href="/entrar?next=/combinar">
                Entrar na minha conta
              </Link>
              <p>
                Ainda não tem conta? <Link href="/cadastro">Criar conta</Link>
              </p>
            </div>
          </div>
        ) : null}

        {status === "error" && !pantryAuthError ? (
          <div className={`${styles.stateCard} ${styles.solidState}`}>
            <span className={styles.stateBubble} aria-hidden="true">!</span>
            <h3>Algo saiu do ponto</h3>
            <p>{requestError}</p>
            <button
              className={styles.retryButton}
              onClick={() =>
                void (resultMode === "pantry"
                  ? findRecipesFromPantry()
                  : findRecipes())
              }
              type="button"
            >
              Tentar de novo
            </button>
          </div>
        ) : null}

        {status === "success" && results.length === 0 ? (
          <div className={styles.stateCard}>
            <span className={styles.stateBubble} aria-hidden="true">?</span>
            <h3>Nenhuma receita encontrada</h3>
            <p>
              {resultMode === "pantry"
                ? "Sua despensa ainda não encontrou uma combinação. Adicione mais ingredientes ou revise o que está cadastrado."
                : "Tente adicionar outros itens da sua cozinha para encontrarmos uma combinação."}
            </p>
          </div>
        ) : null}

        {status === "success" && results.length > 0 ? (
          <section aria-labelledby="match-results-title" className={styles.resultSection}>
            <p className={styles.resultEyebrow}>
              {results.length} {results.length === 1 ? "receita" : "receitas"}
              {resultMode === "pantry" ? " · usando sua despensa" : ""}
            </p>

            <h2 className={styles.resultTitle} id="match-results-title">
              {readyCount > 0 ? (
                <>
                  Com {summaryIngredients}, dá pra fazer{" "}
                  <span>{readyCount}</span>{" "}
                  {readyCount === 1 ? "receita" : "receitas"} agora.
                </>
              ) : (
                <>
                  Com {summaryIngredients}, você está a{" "}
                  <span>{nearestMissingCount}</span>{" "}
                  {nearestMissingCount === 1 ? "ingrediente" : "ingredientes"} de{" "}
                  {firstResult.title.toLocaleLowerCase("pt-BR")}.
                </>
              )}
            </h2>

            <p className={styles.resultSub}>
              {resultMode === "pantry"
                ? "Compatibilidade primeiro; em resultados próximos, priorizamos alimentos perto do vencimento."
                : hasMoreResults
                  ? `Mostrando as ${visibleResults.length} melhores por aqui.`
                  : "Da maior compatibilidade para a menor."}
            </p>

            <div className={styles.resultList}>
              {visibleResults.map((recipe) => (
                <MatchResultRow
                  key={recipe.id}
                  recipe={recipe}
                  urgentIngredientNames={urgentIngredientNames(recipe)}
                />
              ))}
            </div>

            {hasMoreResults && resultMode === "manual" ? (
              <Link className={styles.seeAll} href={combineHref}>
                Ver todas as combinações <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </section>
        ) : null}
      </section>
    </div>
  );
}
