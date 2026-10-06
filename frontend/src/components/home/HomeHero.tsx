"use client";

import { useEffect, useMemo, useState } from "react";

import { getIngredients, type IngredientOption } from "@/services/pantry.service";
import type { MatchRecipeResult } from "@/types/recipe";

import styles from "./HomeHero.module.css";

const QUICK_INGREDIENTS = ["arroz", "tomate", "ovo", "frango", "batata", "cenoura"];

type HomeHeroProps = {
  ingredients: string[];
  matches: MatchRecipeResult[];
  onAddIngredient: (ingredient: string) => void;
  onRemoveIngredient: (ingredient: string) => void;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function isSameIngredient(a: string, b: string) {
  return normalize(a) === normalize(b);
}

function RecipeName({ recipe }: { recipe: MatchRecipeResult | undefined }) {
  return <span className={styles.recipeName}>{recipe ? recipe.title.toLocaleLowerCase("pt-BR") : ""}</span>;
}

export function HomeHero({
  ingredients,
  matches,
  onAddIngredient,
  onRemoveIngredient,
}: HomeHeroProps) {
  const [value, setValue] = useState("");
  const [ingredientOptions, setIngredientOptions] = useState<IngredientOption[]>([]);
  const [ingredientOptionsLoaded, setIngredientOptionsLoaded] = useState(false);

  useEffect(() => {
    if (ingredientOptionsLoaded) return;
    void getIngredients()
      .then((options) => {
        setIngredientOptions(options);
        setIngredientOptionsLoaded(true);
      })
      .catch(() => setIngredientOptionsLoaded(true));
  }, [ingredientOptionsLoaded]);

  const bestMatch = useMemo(() => matches[0], [matches]);
  const readyCount = matches.filter((recipe) => recipe.status === "READY").length;
  const oneAwayCount = matches.filter((recipe) => recipe.missingIngredients.length === 1).length;
  const usableCount = matches.length;

  const phrase = (() => {
    if (ingredients.length === 0) {
      return <span>O que tem aí na sua cozinha?</span>;
    }

    const have = ingredients.map((ingredient) => (
      <button
        aria-label={"Remover " + ingredient}
        className={styles.haveChip}
        key={ingredient}
        onClick={() => onRemoveIngredient(ingredient)}
        type="button"
      >
        <span>{ingredient}</span>
        <b aria-hidden="true">×</b>
      </button>
    ));

    if (!bestMatch) {
      return (
        <>
          <span>Com </span>
          {have}
          <span>, ainda não fecha uma receita. Que tal mais um ingrediente?</span>
        </>
      );
    }

    const missing = bestMatch.missingIngredients;

    if (missing.length === 0) {
      return (
        <>
          <span>Com </span>
          {have}
          <span>, dá pra fazer </span>
          <RecipeName recipe={bestMatch} />
          <span>.</span>
        </>
      );
    }

    const missingButtons = missing.slice(0, 3).map((ingredient) => (
      <button
        className={styles.missingChip}
        key={ingredient.id}
        onClick={() => onAddIngredient(ingredient.name)}
        type="button"
      >
        <span aria-hidden="true">+</span>
        {ingredient.name}
      </button>
    ));

    if (missing.length === 1) {
      return (
        <>
          <span>Com </span>
          {have}
          <span>, falta só </span>
          {missingButtons}
          <span> pra fazer </span>
          <RecipeName recipe={bestMatch} />
          <span>.</span>
        </>
      );
    }

    if (missing.length === 2) {
      return (
        <>
          <span>Com </span>
          {have}
          <span>, faltam só </span>
          {missingButtons[0]}
          <span> e </span>
          {missingButtons[1]}
          <span> pra fazer </span>
          <RecipeName recipe={bestMatch} />
          <span>.</span>
        </>
      );
    }

    return (
      <>
        <span>Com </span>
        {have}
        <span>, você está a </span>
        <strong className={styles.missingCount}>{missing.length}</strong>
        <span> ingredientes de </span>
        <RecipeName recipe={bestMatch} />
        <span>.</span>
      </>
    );
  })();

  function addTypedIngredient() {
    const candidate = value.trim();
    if (!candidate) return;

    onAddIngredient(candidate);
    setValue("");
  }

  return (
    <section className={styles.hero} id="inicio">
      <div className={"home-container " + styles.heroInner}>
        <h1 aria-live="polite">{phrase}</h1>

        <div className={styles.controls}>
          <form
            className={styles.addForm}
            onSubmit={(event) => {
              event.preventDefault();
              addTypedIngredient();
            }}
          >
            <input
              aria-label="Adicionar ingrediente"
              list="receitando-ingredients"
              onChange={(event) => setValue(event.target.value)}
              placeholder="O que mais tem aí?"
              value={value}
            />
            <datalist id="receitando-ingredients">
              {ingredientOptions.map((option) => <option key={option.id} value={option.name} />)}
            </datalist>
            <button type="submit">Adicionar</button>
          </form>

          <div aria-label="Atalhos de ingredientes" className={styles.quickList}>
            {QUICK_INGREDIENTS.map((ingredient) => {
              const selected = ingredients.some((item) => isSameIngredient(item, ingredient));
              return (
                <button
                  aria-disabled={selected}
                  className={styles.quickButton}
                  disabled={selected}
                  key={ingredient}
                  onClick={() => onAddIngredient(ingredient)}
                  type="button"
                >
                  {ingredient}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.summary}>
          {ingredients.length === 0 ? (
            <span>Comece digitando ou escolha um ingrediente acima.</span>
          ) : (
            <>
              {readyCount > 0 ? <span>{readyCount} {readyCount === 1 ? "pronta" : "prontas"} pra fazer</span> : null}
              {readyCount > 0 && oneAwayCount > 0 ? <span>, </span> : null}
              {oneAwayCount > 0 ? <span>{oneAwayCount} a um ingrediente de distância</span> : null}
              {(readyCount > 0 || oneAwayCount > 0) ? <span>, </span> : null}
              <span>{usableCount} {usableCount === 1 ? "usando o que você tem" : "usando o que você tem"}</span>
              <a href="#combinacoes">Ver combinações</a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
