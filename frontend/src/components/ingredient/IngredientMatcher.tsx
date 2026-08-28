"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import { IngredientChip } from "@/components/ingredient/IngredientChip";
import { IngredientInput } from "@/components/ingredient/IngredientInput";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
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
  const activeRequest = useRef<AbortController | null>(null);

  function resetResults() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setResults([]);
    setResultMode(null);
    setRequestError("");
    setStatus("idle");
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
      setStatus("error");
      return;
    }

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setFieldError(null);
    setRequestError("");
    setStatus("loading");

    try {
      const [matches, pantry] = await Promise.all([
        matchRecipesFromPantry(controller.signal),
        getPantry(),
      ]);

      if (activeRequest.current !== controller) return;

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

  return (
    <div className={styles.matcher}>
      <div className={styles.panel}>
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
          <div className={styles.listHeading}>
            <span>Seus ingredientes</span>
            <span>{ingredients.length} adicionados</span>
          </div>

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

        <Button
          disabled={isLoading}
          fullWidth
          onClick={findRecipes}
          type="button"
        >
          {isLoading ? "Comparando ingredientes…" : "Encontrar receitas"}
        </Button>

        <button
          className={styles.pantryButton}
          disabled={isLoading}
          onClick={() => void findRecipesFromPantry()}
          type="button"
        >
          <strong>Usar minha despensa</strong>
          <span>Leva a validade em conta para desempatar receitas próximas.</span>
        </button>
      </div>

      <div aria-live="polite" aria-busy={isLoading} className={styles.results}>
        {status === "idle" ? (
          <div className={styles.idle}>
            <div>
              <strong>As melhores combinações aparecem aqui</strong>
              <p>
                A compatibilidade considera os ingredientes obrigatórios. Com a despensa, o que vence antes também ganha prioridade.
              </p>
            </div>
          </div>
        ) : null}

        {status === "loading" ? (
          <LoadingState label="Comparando sua lista com as receitas…" />
        ) : null}

        {status === "error" ? (
          <ErrorState message={requestError} onRetry={resultMode === "pantry" ? findRecipesFromPantry : findRecipes} />
        ) : null}

        {status === "success" && results.length === 0 ? (
          <EmptyState
            description={resultMode === "pantry"
              ? "Sua despensa ainda não encontrou uma combinação. Adicione mais ingredientes ou revise o que está cadastrado."
              : "Tente adicionar outros itens da sua cozinha para encontrarmos uma combinação."}
            icon="?"
            title="Nenhuma receita encontrada"
          />
        ) : null}

        {status === "success" && results.length > 0 ? (
          <section aria-labelledby="match-results-title" className={styles.resultSection}>
            <div className={styles.resultHeading}>
              <div>
                <p className={styles.resultEyebrow}>Resultado da comparação</p>
                <h2 id="match-results-title">
                  {results.length} {results.length === 1 ? "receita" : "receitas"}
                </h2>
              </div>
              <p>
                {resultMode === "pantry"
                  ? "Compatibilidade primeiro; em resultados próximos, priorizamos alimentos perto do vencimento."
                  : hasMoreResults
                    ? `Mostrando as ${visibleResults.length} melhores por aqui.`
                    : "Da maior compatibilidade para a menor."}
              </p>
            </div>
            <div className={styles.grid}>
              {visibleResults.map((recipe) => (
                <RecipeCard
                  compatibility={recipe.compatibility}
                  description={
                    recipe.description ??
                    "Uma possibilidade gostosa para aproveitar sua cozinha."
                  }
                  difficulty={recipe.difficulty}
                  imageUrl={recipe.imageUrl}
                  key={recipe.id}
                  mealType={recipe.mealType}
                  missingIngredients={recipe.missingIngredients}
                  prepMinutes={recipe.prepMinutes}
                  recipeId={recipe.id}
                  servings={recipe.servings}
                  slug={recipe.slug}
                  status={recipe.status}
                  title={recipe.title}
                />
              ))}
            </div>

            {hasMoreResults && resultMode === "manual" ? (
              <Link className={styles.seeAll} href={combineHref}>
                Ver todas as combinações
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
}
