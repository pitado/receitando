"use client";

import { useMemo, useState, type FormEvent } from "react";

import { adaptRecipe } from "@/services/recipes.service";
import { hasAuthSessionHint } from "@/services/auth-storage";
import type {
  AdaptationConfidence,
  CulinarySignal,
  RecipeAdaptationResult,
  RecipeIngredient,
} from "@/types/recipe";

import styles from "./RecipeAdapter.module.css";

interface RecipeAdapterProps {
  recipeSlug: string;
  servings: number;
  ingredients: RecipeIngredient[];
}

const confidenceLabels: Record<AdaptationConfidence, string> = {
  HIGH: "alta confiança",
  MEDIUM: "confiança média",
  LOW: "baixa confiança",
};

const culinarySignalLabels: Record<CulinarySignal, string> = {
  BAKED: "assado",
  FRIED: "frito",
  COOKED: "cozido",
  FRESH: "fresco",
  AERATED: "depende de aeração",
  EGG_CENTRIC: "ovo é estrutural",
  SWEET: "doce",
  SAVORY: "salgado",
};

function overallConfidenceLabel(value: number): string {
  if (value >= 90) return "Adaptação muito consistente";
  if (value >= 70) return "Adaptação consistente";
  if (value >= 50) return "Adaptação com ressalvas";
  return "Requer conferência manual";
}

export function RecipeAdapter({ recipeSlug, servings, ingredients }: RecipeAdapterProps) {
  const [targetServings, setTargetServings] = useState(servings > 0 ? servings : 1);
  const [unavailable, setUnavailable] = useState<Set<string>>(() => new Set());
  const [result, setResult] = useState<RecipeAdaptationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usePantry, setUsePantry] = useState(false);

  const unavailableNames = useMemo(
    () => ingredients.filter((item) => unavailable.has(item.ingredientId)).map((item) => item.name),
    [ingredients, unavailable],
  );

  function toggleIngredient(ingredientId: string) {
    setUnavailable((current) => {
      const next = new Set(current);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
  }

  function togglePantry(checked: boolean) {
    if (checked && !hasAuthSessionHint()) {
      setUsePantry(false);
      setError("Entre na sua conta para cruzar esta receita com a sua despensa.");
      return;
    }
    setError(null);
    setUsePantry(checked);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const adaptation = await adaptRecipe(recipeSlug, {
        ...(servings > 0 ? { targetServings } : {}),
        unavailableIngredients: unavailableNames,
        usePantry,
      });
      setResult(adaptation);
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível adaptar esta receita agora.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="recipe-adapter-title" className={styles.shell}>
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Motor culinário · experimental</p>
          <h2 id="recipe-adapter-title">Adapte à sua cozinha</h2>
          <p>
            Mude o rendimento e marque o que está faltando. O Receitando recalcula as quantidades,
            cruza sua despensa, procura substituições e leva o tipo de preparo em consideração.
          </p>
        </div>
        <span className={styles.version}>Engine v1.1</span>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.controls}>
          {servings > 0 ? (
            <label className={styles.servingsControl}>
              <span>Quero preparar</span>
              <span className={styles.servingsInput}>
                <input
                  aria-label="Quantidade de porções desejadas"
                  max={50}
                  min={1}
                  onChange={(event) => setTargetServings(Number(event.target.value) || 1)}
                  type="number"
                  value={targetServings}
                />
                <span>porções</span>
              </span>
              <small>Receita original: {servings} {servings === 1 ? "porção" : "porções"}.</small>
            </label>
          ) : (
            <div className={styles.unknownYield}>
              <strong>Rendimento original ainda não informado.</strong>
              <span>As trocas funcionam normalmente; a escala de quantidades fica preservada por segurança.</span>
            </div>
          )}

          <div className={styles.missingSummary}>
            <strong>{unavailable.size}</strong>
            <span>{unavailable.size === 1 ? "ingrediente marcado" : "ingredientes marcados"}</span>
          </div>
        </div>

        <label className={styles.pantryControl}>
          <input
            checked={usePantry}
            onChange={(event) => togglePantry(event.target.checked)}
            type="checkbox"
          />
          <span>
            <strong>Usar minha despensa automaticamente</strong>
            <small>
              Requer login. O motor identifica o que você já tem, o que falta e quando a quantidade parece insuficiente.
            </small>
          </span>
        </label>

        <fieldset className={styles.ingredientsFieldset}>
          <legend>O que você sabe que está faltando?</legend>
          <div className={styles.ingredientGrid}>
            {ingredients.map((ingredient) => {
              const checked = unavailable.has(ingredient.ingredientId);
              return (
                <label className={`${styles.ingredientOption} ${checked ? styles.selected : ""}`} key={ingredient.ingredientId}>
                  <input
                    checked={checked}
                    onChange={() => toggleIngredient(ingredient.ingredientId)}
                    type="checkbox"
                  />
                  <span>{ingredient.name}</span>
                  {ingredient.optional ? <small>opcional</small> : null}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className={styles.actions}>
          <button disabled={loading} type="submit">
            {loading ? "Calculando adaptação…" : "Gerar receita adaptada"}
          </button>
          <p>O motor usa regras culinárias explicáveis; ele não altera a receita original.</p>
        </div>
      </form>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      {result ? (
        <div aria-live="polite" className={styles.result}>
          <div className={styles.resultHeader}>
            <div>
              <p className={styles.eyebrow}>Resultado</p>
              <h3>{result.recipeTitle} adaptada</h3>
              <p>{overallConfidenceLabel(result.confidence)}.</p>
            </div>
            <div className={styles.score} aria-label={`Confiança da adaptação: ${result.confidence}%`}>
              <strong>{result.confidence}%</strong>
              <span>confiança</span>
            </div>
          </div>

          {result.culinaryContext.signals.length > 0 ? (
            <div className={styles.contextPanel}>
              <strong>Contexto que o motor identificou</strong>
              <div>
                {result.culinaryContext.signals.map((signal) => (
                  <span key={signal}>{culinarySignalLabels[signal]}</span>
                ))}
              </div>
              {result.culinaryContext.evidence.length > 0 ? (
                <small>{result.culinaryContext.evidence.join(" · ")}</small>
              ) : null}
            </div>
          ) : null}

          {result.pantry.used ? (
            <div className={styles.pantryResult}>
              <div><strong>{result.pantry.presentCount}</strong><span>na despensa</span></div>
              <div><strong>{result.pantry.missingCount}</strong><span>não encontrados</span></div>
              <div><strong>{result.pantry.shortageCount}</strong><span>quantidades curtas</span></div>
            </div>
          ) : null}

          {result.changes.length > 0 ? (
            <ul className={styles.changes}>
              {result.changes.map((change, index) => (
                <li key={`${change.type}-${change.ingredientId ?? index}`}>{change.message}</li>
              ))}
            </ul>
          ) : null}

          <div className={styles.adaptedIngredients}>
            {result.ingredients.map((ingredient) => (
              <article className={ingredient.unavailable ? styles.changedIngredient : undefined} key={ingredient.ingredientId}>
                <div className={styles.amount}>
                  {ingredient.adapted.displayAmount ?? ingredient.original.rawText ?? "a gosto"}
                </div>
                <div className={styles.ingredientText}>
                  <strong>{ingredient.adaptedName}</strong>
                  {ingredient.substitution ? (
                    <>
                      <span>
                        No lugar de {ingredient.originalName} · {confidenceLabels[ingredient.substitution.recommended.confidence]}
                      </span>
                      <p>{ingredient.substitution.recommended.reason}</p>
                      {ingredient.substitution.alternatives.length > 0 ? (
                        <small>
                          Outra opção: {ingredient.substitution.alternatives.map((option) => option.name).join(", ")}.
                        </small>
                      ) : null}
                    </>
                  ) : ingredient.unavailable ? (
                    <span>Sem substituição confiável para este contexto.</span>
                  ) : (
                    <span>{ingredient.optional ? "Opcional" : "Mantido da receita original"}</span>
                  )}
                  {ingredient.warnings.map((warning) => <p className={styles.warning} key={warning}>{warning}</p>)}
                </div>
              </article>
            ))}
          </div>

          {result.warnings.length > 0 ? (
            <div className={styles.warningBox}>
              <strong>Conferências recomendadas</strong>
              <ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
