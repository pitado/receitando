"use client";

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
import { matchRecipes } from "@/services/recipes.service";
import type { MatchRecipeResult } from "@/types/recipe";

import styles from "./IngredientMatcher.module.css";

type MatcherStatus = "idle" | "loading" | "success" | "error";

const suggestions = ["ovo", "banana", "farinha de trigo", "leite"];

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.kind === "connection") {
    return "Não foi possível buscar receitas agora. Verifique se a API está ligada e tente novamente.";
  }

  if (error instanceof ApiError && error.status === 400) {
    return "Não conseguimos entender essa lista de ingredientes. Revise os itens e tente novamente.";
  }

  return "Não foi possível buscar receitas agora. Tente novamente.";
}

export function IngredientMatcher() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [results, setResults] = useState<MatchRecipeResult[]>([]);
  const [status, setStatus] = useState<MatcherStatus>("idle");
  const [requestError, setRequestError] = useState("");
  const activeRequest = useRef<AbortController | null>(null);

  function resetResults() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setResults([]);
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

      if (activeRequest.current !== controller) {
        return;
      }

      setResults(
        [...matches].sort((first, second) => second.compatibility - first.compatibility),
      );
      setStatus("success");
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      if (activeRequest.current === controller) {
        setRequestError(getErrorMessage(error));
        setStatus("error");
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
      }
    }
  }

  const isLoading = status === "loading";

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
              Sua lista ainda está vazia. Adicione um item acima.
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
      </div>

      <div aria-live="polite" aria-busy={isLoading} className={styles.results}>
        {status === "idle" ? (
          <div className={styles.idle}>
            <span aria-hidden="true" className={styles.idleMark}>
              R
            </span>
            <div>
              <strong>As melhores combinações aparecem aqui</strong>
              <p>
                A compatibilidade considera os ingredientes obrigatórios de cada
                receita.
              </p>
            </div>
          </div>
        ) : null}

        {status === "loading" ? (
          <LoadingState label="Comparando sua lista com as receitas…" />
        ) : null}

        {status === "error" ? (
          <ErrorState message={requestError} onRetry={findRecipes} />
        ) : null}

        {status === "success" && results.length === 0 ? (
          <EmptyState
            description="Tente adicionar outros itens da sua cozinha para encontrarmos uma combinação."
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
              <p>Da maior compatibilidade para a menor.</p>
            </div>
            <div className={styles.grid}>
              {results.map((recipe) => (
                <RecipeCard
                  compatibility={recipe.compatibility}
                  description={
                    recipe.description ??
                    "Uma possibilidade gostosa para aproveitar sua cozinha."
                  }
                  key={recipe.id}
                  missingIngredients={recipe.missingIngredients}
                  prepMinutes={recipe.prepMinutes}
                  servings={recipe.servings}
                  slug={recipe.slug}
                  title={recipe.title}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
