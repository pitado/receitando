"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

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
      <div className={`container ${styles.inner}`}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" className={styles.eyebrowMark}>⌁</span>
            Sua cozinha, mais leve
          </p>

          <h1>Cozinhe com o que você já tem.</h1>

          <p className={styles.description}>
            Encontre receitas, descubra novas combinações e aproveite melhor os
            ingredientes que já estão na sua casa.
          </p>

          <form className={styles.searchForm} onSubmit={searchRecipes}>
            <label className={styles.searchField} htmlFor="home-ingredient-search">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m21 21-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
              </svg>
              <span className="sr-only">Ingredientes que você tem</span>
              <input
                autoComplete="off"
                id="home-ingredient-search"
                onChange={(event) => setIngredients(event.target.value)}
                placeholder="O que você tem na sua despensa?"
                type="text"
                value={ingredients}
              />
            </label>
            <button className={styles.searchButton} type="submit">
              Buscar receitas
            </button>
          </form>

          <div className={styles.suggestions}>
            <span>Você pode ter:</span>
            <div className={styles.chips}>
              {SUGGESTED_INGREDIENTS.map((ingredient) => (
                <button
                  key={ingredient}
                  onClick={() => addIngredient(ingredient)}
                  type="button"
                >
                  {ingredient}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div aria-hidden="true" className={styles.visual}>
          <span className={styles.organicShape} />
          <Image
            alt=""
            className={styles.character}
            height={640}
            priority
            sizes="(max-width: 767px) 88vw, (max-width: 1100px) 44vw, 620px"
            src="/receitando-hero-personagem.webp"
            width={665}
          />
        </div>
      </div>
    </section>
  );
}
