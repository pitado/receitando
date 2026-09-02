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
  const selectedIngredients = parseIngredients(ingredients);
  const visualIngredients = selectedIngredients.length
    ? selectedIngredients.slice(0, 4)
    : ["arroz", "ovo", "tomate"];

  function searchRecipes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedIngredients.length) {
      router.push("/combinar");
      return;
    }

    const params = new URLSearchParams({ ingredientes: selectedIngredients.join(",") });
    router.push(`/combinar?${params.toString()}`);
  }

  function toggleIngredient(ingredient: string) {
    const normalized = ingredient.toLocaleLowerCase("pt-BR");
    const exists = selectedIngredients.some(
      (item) => item.toLocaleLowerCase("pt-BR") === normalized,
    );

    const nextIngredients = exists
      ? selectedIngredients.filter(
          (item) => item.toLocaleLowerCase("pt-BR") !== normalized,
        )
      : [...selectedIngredients, ingredient];

    setIngredients(nextIngredients.join(", "));
  }

  return (
    <section className={styles.hero}>
      <div className={`container ${styles.heroShell}`}>
        <div className={styles.heroGrid}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>Comece pelo que já existe</p>
            <h1>Cozinhe com o que você já tem.</h1>
            <p className={styles.description}>
              Digite os ingredientes da sua casa e transforme a despensa em receitas possíveis — com menos desperdício, menos compra por impulso e mais ideia para cozinhar.
            </p>

            <form className={styles.searchForm} id="ingredientes" onSubmit={searchRecipes}>
              <div className={styles.searchField}>
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="m21 21-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
                </svg>
                <label className="sr-only" htmlFor="home-ingredient-search">
                  Ingredientes que você tem
                </label>
                <input
                  autoComplete="off"
                  id="home-ingredient-search"
                  onChange={(event) => setIngredients(event.target.value)}
                  placeholder="Ex.: arroz, ovo, tomate..."
                  type="text"
                  value={ingredients}
                />
                {ingredients ? (
                  <button
                    aria-label="Limpar ingredientes"
                    className={styles.clearButton}
                    onClick={() => setIngredients("")}
                    type="button"
                  >
                    ×
                  </button>
                ) : null}
              </div>

              <button className={styles.searchButton} type="submit">
                <span>Buscar receitas</span>
                <span aria-hidden="true">↗</span>
              </button>
            </form>

            <div className={styles.suggestions}>
              <span>Adicione rápido</span>
              <div className={styles.chips}>
                {SUGGESTED_INGREDIENTS.map((ingredient) => {
                  const isSelected = selectedIngredients.some(
                    (item) =>
                      item.toLocaleLowerCase("pt-BR") ===
                      ingredient.toLocaleLowerCase("pt-BR"),
                  );

                  return (
                    <button
                      aria-label={ingredient}
                      aria-pressed={isSelected}
                      className={isSelected ? styles.chipSelected : undefined}
                      key={ingredient}
                      onClick={() => toggleIngredient(ingredient)}
                      type="button"
                    >
                      <span aria-hidden="true">{isSelected ? "✓" : "+"}</span> {ingredient}
                    </button>
                  );
                })}
              </div>
            </div>

            <p aria-live="polite" className={styles.selectionStatus}>
              {selectedIngredients.length
                ? `${selectedIngredients.length} ${selectedIngredients.length === 1 ? "ingrediente pronto" : "ingredientes prontos"} para combinar.`
                : "Você pode começar digitando ou escolhendo um ingrediente acima."}
            </p>

            <div aria-label="Como funciona" className={styles.metrics}>
              <div className={styles.metric}>
                <strong>01</strong>
                <span>conte o que tem</span>
              </div>
              <div className={styles.metric}>
                <strong>02</strong>
                <span>compare possibilidades</span>
              </div>
              <div className={styles.metric}>
                <strong>03</strong>
                <span>escolha e cozinhe</span>
              </div>
            </div>
          </div>

          <div aria-hidden="true" className={styles.visual}>
            <div className={styles.visualCard}>
              <div className={styles.visualHeader}>
                <span>NA SUA BANCADA</span>
                <strong>{String(visualIngredients.length).padStart(2, "0")} itens</strong>
              </div>

              <div className={styles.plate}>
                <span className={styles.plateRing} />
                <span className={styles.herbOne} />
                <span className={styles.herbTwo} />
                <span className={styles.tomato} />
                <span className={styles.egg} />
              </div>

              <div className={styles.ingredientCloud}>
                {visualIngredients.map((ingredient) => (
                  <span key={ingredient}>{ingredient}</span>
                ))}
              </div>

              <div className={styles.recipeTicket}>
                <span>ponto de partida</span>
                <strong>
                  {selectedIngredients.length
                    ? "sua combinação já começou"
                    : "três ingredientes já bastam"}
                </strong>
                <p>adicione o que tem · descubra combinações · cozinhe</p>
              </div>

              <div className={styles.stamp}>
                <span>use primeiro</span>
                <strong>o que já tem</strong>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.brandSignature}>
          <BiteWordmark centered />
        </div>
      </div>
    </section>
  );
}
