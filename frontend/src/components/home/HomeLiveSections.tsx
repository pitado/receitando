"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { FoodAvatar } from "@/components/profile/FoodAvatar";
import { getAuthToken } from "@/services/auth-storage";
import { getCurrentUser, type AuthUser } from "@/services/auth.service";
import { getHomeFeed, type HomeFeed } from "@/services/home.service";
import { getPantry } from "@/services/pantry.service";
import { matchRecipesFromPantry } from "@/services/recipes.service";
import type { MatchRecipeResult } from "@/types/recipe";

import styles from "./HomeLiveSections.module.css";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "cozinheiro";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value));
}

export function HomeLiveSections() {
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pantryCount, setPantryCount] = useState(0);
  const [matches, setMatches] = useState<MatchRecipeResult[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const feedResult = await Promise.allSettled([getHomeFeed()]);
      if (!cancelled && feedResult[0].status === "fulfilled") {
        setFeed(feedResult[0].value);
      }

      if (getAuthToken()) {
        const accountResult = await Promise.allSettled([
          getCurrentUser(),
          getPantry(),
          matchRecipesFromPantry(),
        ]);
        if (!cancelled) {
          if (accountResult[0].status === "fulfilled") setUser(accountResult[0].value);
          if (accountResult[1].status === "fulfilled") setPantryCount(accountResult[1].value.length);
          if (accountResult[2].status === "fulfilled") setMatches(accountResult[2].value);
        }
      }

      if (!cancelled) setLoaded(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = matches.filter((recipe) => recipe.status === "READY").slice(0, 3);
  const almost = matches.filter((recipe) => recipe.status === "ALMOST_READY").slice(0, 3);
  const suggestions = ready.length > 0 ? ready : almost;

  return (
    <>
      {user ? (
        <section className={styles.personalSection}>
          <div className={`container ${styles.personalCard}`}>
            <div>
              <p className={styles.eyebrow}>SUA COZINHA HOJE</p>
              <h2>Boa, {firstName(user.name)}. Sua despensa já está trabalhando.</h2>
              <p>
                Você tem <strong>{pantryCount}</strong> {pantryCount === 1 ? "ingrediente" : "ingredientes"} guardados
                {ready.length > 0 ? <> e <strong>{ready.length}</strong> {ready.length === 1 ? "receita pronta" : "receitas prontas"} para ir ao fogo.</> : "."}
              </p>
            </div>
            <Link href="/receitas" className={styles.textLink}>Ver minhas combinações →</Link>
          </div>
        </section>
      ) : null}

      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>{user ? "COM O QUE VOCÊ JÁ TEM" : "PARA COMEÇAR AGORA"}</p>
              <h2>{user ? (ready.length > 0 ? "Dá para fazer agora" : "Falta pouca coisa") : "Receitas para abrir o apetite"}</h2>
            </div>
            <Link href="/receitas" className={styles.textLink}>Ver todas →</Link>
          </div>

          <div className={styles.recipeGrid}>
            {(suggestions.length > 0 ? suggestions : feed?.popular ?? []).slice(0, 3).map((recipe) => (
              <Link className={styles.recipeCard} href={`/receitas/${recipe.slug}`} key={recipe.id}>
                <span className={styles.recipeMeta}>
                  {"compatibility" in recipe ? `${recipe.compatibility}% compatível` : recipe.mealType || "Receita da casa"}
                </span>
                <h3>{recipe.title}</h3>
                <p>{recipe.description}</p>
                <div className={styles.recipeFooter}>
                  <span>{recipe.prepMinutes} min</span>
                  {"likes" in recipe ? <span>{recipe.likes} gostaram</span> : null}
                  <strong>Ver receita →</strong>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {feed ? (
        <section className={styles.statsSection}>
          <div className={`container ${styles.statsGrid}`}>
            <div className={styles.statLead}>
              <p className={styles.eyebrow}>A COZINHA ESTÁ VIVA</p>
              <h2>Ideias que crescem quando todo mundo cozinha junto.</h2>
            </div>
            <div className={styles.stat}><strong>{feed.totals.recipes}</strong><span>receitas no caderno</span></div>
            <div className={styles.stat}><strong>{feed.totals.likes}</strong><span>avaliações positivas</span></div>
            <div className={styles.stat}><strong>{feed.totals.comments}</strong><span>pitadas compartilhadas</span></div>
          </div>
        </section>
      ) : null}

      {feed?.recentComments.length ? (
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>A COZINHA ESTÁ CONVERSANDO</p>
                <h2>Quem fez, deixou uma pitada.</h2>
              </div>
            </div>
            <div className={styles.commentGrid}>
              {feed.recentComments.map((comment) => (
                <Link href={`/receitas/${comment.recipeSlug}`} className={styles.commentCard} key={comment.id}>
                  <div className={styles.authorRow}>
                    <FoodAvatar avatarKey={comment.avatarKey} className={styles.avatar} label={`Avatar de ${comment.authorName}`} />
                    <div>
                      <strong>{comment.authorName}</strong>
                      <span>{comment.authorHandle ? `@${comment.authorHandle}` : "cozinheiro do Receitando"} · {formatDate(comment.createdAt)}</span>
                    </div>
                  </div>
                  <blockquote>“{comment.body}”</blockquote>
                  <small>em {comment.recipeTitle} →</small>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.manifesto}>
        <div className={`container ${styles.manifestoInner}`}>
          <p className={styles.eyebrow}>MENOS DESPERDÍCIO, MAIS IDEIA</p>
          <h2>Antes de pensar no que comprar, olha o que já mora na sua cozinha.</h2>
          <p>O Receitando junta despensa, receitas e experiências da comunidade para transformar ingredientes esquecidos em possibilidades reais.</p>
          <Link href="#ingredientes" className={styles.textLink}>Começar pela minha cozinha ↑</Link>
        </div>
      </section>

      {!loaded ? <span className={styles.srOnly}>Carregando sugestões da cozinha.</span> : null}
    </>
  );
}
