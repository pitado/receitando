"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { BiteWordmark } from "./BiteWordmark";
import styles from "./HomeHero.module.css";

const SUGGESTED_INGREDIENTS = [
  "arroz",
  "tomate",
  "ovo",
  "frango",
  "batata",
  "cenoura",
];

const FLAVOR_WORDS = [
  "menos desperdício",
  "mais improviso",
  "a sua despensa primeiro",
  "receitas possíveis",
  "pitadas da comunidade",
];

function parseIngredients(value: string): string[] {
  const seen = new Set<string>();

  return value
    .split(/[,;\n]+/)
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => {
      const normalized = ingredient.toLocaleLowerCase("pt-BR");
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .slice(0, 30);
}

export function HomeHero() {
  const router = useRouter();
  const [ingredients, setIngredients] = useState("");

  function searchRecipes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseIngredients(ingredients);

    if (!parsed.length) {
      router.push("/combinar");
      return;
    }

    const params = new URLSearchParams({ ingredientes: parsed.join(",") });
    router.push(`/combinar?${params.toString()}`);
  }

  function addIngredient(ingredient: string) {
    const parsed = parseIngredients(ingredients);
    const alreadyAdded = parsed.some(
      (item) => item.toLocaleLowerCase("pt-BR") === ingredient.toLocaleLowerCase("pt-BR"),
    );

    if (alreadyAdded) return;
    setIngredients([...parsed, ingredient].join(", "));
  }

  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroShell}`}>
        <div className={styles.brandStage}>
          <div className={styles.brandMeta}>
            <span>cozinha digital · feita para a vida real</span>
            <span>maringá · brasil</span>
          </div>
          <BiteWordmark />
        </div>

        <div className={styles.heroGrid}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Comece pelo que já existe</p>
            <h1>Abra a despensa. A receita começa aqui.</h1>
            <p className={styles.description}>
              O Receitando transforma os ingredientes que você já tem em possibilidades reais de cozinha — sem complicar e sem comprar por comprar.
            </p>

            <form className={styles.searchForm} id="ingredientes" onSubmit={searchRecipes}>
              <label className={styles.searchField} htmlFor="home-ingredient-search">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="m21 21-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
                </svg>
                <span className="sr-only">Ingredientes que você tem</span>
                <input
                  autoComplete="off"
                  id="home-ingredient-search"
                  onChange={(event) => setIngredients(event.target.value)}
                  placeholder="Ex.: arroz, ovo, tomate..."
                  type="text"
                  value={ingredients}
                />
              </label>
              <button className={styles.searchButton} type="submit">
                <span>Buscar receitas</span>
                <span aria-hidden="true">↗</span>
              </button>
            </form>

            <div className={styles.suggestions}>
              <span>Experimente</span>
              <div className={styles.chips}>
                {SUGGESTED_INGREDIENTS.map((ingredient) => (
                  <button
                    aria-label={ingredient}
                    key={ingredient}
                    onClick={() => addIngredient(ingredient)}
                    type="button"
                  >
                    + {ingredient}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div aria-hidden="true" className={styles.visual}>
            <div className={styles.visualHeader}>
              <span>HOJE NA COZINHA</span>
              <strong>03 ideias</strong>
            </div>

            <div className={styles.plate}>
              <span className={styles.plateRing} />
              <span className={styles.herbOne} />
              <span className={styles.herbTwo} />
              <span className={styles.tomato} />
              <span className={styles.egg} />
            </div>

            <div className={styles.recipeTicket}>
              <span>01</span>
              <strong>o que dá para fazer agora?</strong>
              <p>junte o que tem · descubra combinações · cozinhe</p>
            </div>

            <div className={styles.stamp}>
              <span>use primeiro</span>
              <strong>o que já tem</strong>
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className={styles.flavorRail}>
        <div className={styles.flavorTrack}>
          {[0, 1].map((copy) => (
            <div className={styles.flavorSet} key={copy}>
              {FLAVOR_WORDS.map((word) => (
                <span key={`${copy}-${word}`}>
                  {word}
                  <i>✦</i>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
