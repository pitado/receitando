"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getIngredients, type IngredientOption } from "@/services/pantry.service";
import type { MatchRecipeResult } from "@/types/recipe";

import styles from "./HomeHero.module.css";

const QUICK_INGREDIENTS = ["banana", "tomate", "batata", "frango", "macarrão", "cenoura", "alho", "aveia"];

type HomeHeroProps = {
  ingredients: string[];
  matches: MatchRecipeResult[];
  matchState: "idle" | "loading" | "ready" | "error";
  onAddIngredient: (ingredient: string) => void;
  onRemoveIngredient: (ingredient: string) => void;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export function HomeHero({
  ingredients, matches, matchState, onAddIngredient, onRemoveIngredient,
}: HomeHeroProps) {
  const [value, setValue] = useState("");
  const [featuredImageError, setFeaturedImageError] = useState(false);
  const [ingredientOptions, setIngredientOptions] = useState<IngredientOption[]>([]);

  useEffect(() => {
    let active = true;
    getIngredients()
      .then((options) => { if (active) setIngredientOptions(options); })
      .catch(() => { /* A edição dos ingredientes funciona mesmo sem sugestões da API. */ });
    return () => { active = false; };
  }, []);

  const readyCount = useMemo(
    () => matches.filter((recipe) => recipe.status === "READY").length,
    [matches],
  );
  const featuredMatch = matches.find((recipe) => recipe.status === "READY");
  const hasExample = ingredients.length > 0;

  function addTypedIngredient() {
    const ingredient = value.trim();
    if (!ingredient) return;
    onAddIngredient(ingredient);
    setValue("");
  }

  return (
    <section className={styles.hero} id="inicio">
      <div className={"home-container " + styles.heroGrid}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}><span className={styles.sparkle} aria-hidden="true">✳</span> IDEIAS QUE COMEÇAM EM CASA</p>
          <h1>Uma cozinha cheia de <span>possibilidades.</span></h1>
          <p className={styles.lead}>Estes ingredientes são só um exemplo. Tire pelo × o que não tem e coloque os seus — uma boa ideia começa assim.</p>

          <div className={styles.pantryPanel}>
            <div className={styles.pantryHeading}>
              <span>UM EXEMPLO PARA COMEÇAR · TROQUE PELO ×</span>
              <span className={styles.count}>{ingredients.length} {ingredients.length === 1 ? "ingrediente" : "ingredientes"}</span>
            </div>
            <div className={styles.selectedIngredients} aria-label="Ingredientes selecionados">
              {hasExample ? ingredients.map((ingredient) => (
                <button
                  aria-label={"Remover " + ingredient}
                  className={styles.ingredientChip}
                  key={ingredient}
                  onClick={() => onRemoveIngredient(ingredient)}
                  title={"Remover " + ingredient}
                  type="button"
                >
                  {ingredient}<span aria-hidden="true">×</span>
                </button>
              )) : <span className={styles.emptyHint}>Comece com um ingrediente que tenha por aí.</span>}
            </div>
            <form
              className={styles.addForm}
              onSubmit={(event) => { event.preventDefault(); addTypedIngredient(); }}
            >
              <label className="sr-only" htmlFor="home-ingredient">Adicionar ingrediente</label>
              <input
                id="home-ingredient"
                list="receitando-ingredients"
                onChange={(event) => setValue(event.target.value)}
                placeholder="Digite um ingrediente..."
                value={value}
              />
              <datalist id="receitando-ingredients">
                {ingredientOptions.map((option) => <option key={option.id} value={option.name} />)}
              </datalist>
              <button type="submit">Adicionar <span aria-hidden="true">+</span></button>
            </form>
            <div className={styles.quickList}>
              <span className={styles.quickLabel}>TENTE TAMBÉM</span>
              {QUICK_INGREDIENTS.filter((ingredient) =>
                !ingredients.some((selected) => normalize(selected) === normalize(ingredient)),
              ).slice(0, 5).map((ingredient) => (
                <button
                  className={styles.quickButton}
                  key={ingredient}
                  onClick={() => onAddIngredient(ingredient)}
                  type="button"
                >+ {ingredient}</button>
              ))}
            </div>
          </div>

          <div className={styles.summary} aria-live="polite">
            {matchState === "ready" && readyCount > 0 ? (
              <><span className={styles.statusDot} /> {readyCount} {readyCount === 1 ? "receita pronta" : "receitas prontas"} com sua seleção. <a href="#combinacoes">Ver ideias</a></>
            ) : matchState === "ready" && featuredMatch ? (
              <>Já temos sugestões para você. <a href="#combinacoes">Explorar combinações</a></>
            ) : (
              <>Gostou da inspiração? <Link href="/receitas">Explore nossas receitas</Link></>
            )}
          </div>
        </div>

        <div className={styles.featureSide}>
          <Link className={styles.featureCard} href="/receitas/santa-receita-pao-caseiro-economico" aria-label="Ver receita de pão caseiro econômico">
            <div className={styles.featureImage}>
              {featuredImageError ? (
                <div className={styles.photoFallback} aria-hidden="true"><span>✳</span><strong>Feito com carinho</strong></div>
              ) : (
                <Image
                  alt="Pão caseiro econômico recém-assado, receita do Santa Receita"
                  fill
                  onError={() => setFeaturedImageError(true)}
                  priority
                  sizes="(max-width: 860px) 90vw, 40vw"
                  src="https://pqqojywezkftgvmkqxye.supabase.co/storage/v1/object/public/recipe-images/imported/b601e21e688058918332da6f6962b35989752213fe3ea4b63cef33f0b33c0720"
                />
              )}
            </div>
            <div className={styles.featureDetails}>
              <p>INSPIRAÇÃO DO SANTA RECEITA</p>
              <h2>Pão Caseiro Econômico</h2>
              <div className={styles.featureFooter}><span>Para se inspirar · 70 min</span><strong>Ver receita <span aria-hidden="true">↗</span></strong></div>
            </div>
          </Link>
          <span className={styles.featureCaption}>Uma receita de verdade, só para abrir o apetite.</span>
        </div>
      </div>
    </section>
  );
}
