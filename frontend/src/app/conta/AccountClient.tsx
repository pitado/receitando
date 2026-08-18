"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getCurrentUser, type AuthUser } from "@/services/auth.service";
import { listFavorites } from "@/services/favorites.service";
import { getPantry } from "@/services/pantry.service";

import styles from "./page.module.css";

function greetingForHour(hour: number) {
  if (hour < 12) {
    return {
      label: "Bom dia",
      line: "Bora colocar uma ideia no fogo?",
    };
  }
  if (hour < 18) {
    return {
      label: "Boa tarde",
      line: "Tem receita boa saindo do forno.",
    };
  }
  return {
    label: "Boa noite",
    line: "Ainda dá tempo de temperar o dia.",
  };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "R";
}

export function AccountClient() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [pantryCount, setPantryCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hour, setHour] = useState<number | null>(null);

  useEffect(() => {
    setHour(new Date().getHours());

    let cancelled = false;
    async function load() {
      try {
        const currentUser = await getCurrentUser();
        const [pantry, favorites] = await Promise.all([getPantry(), listFavorites()]);
        if (cancelled) return;
        setUser(currentUser);
        setPantryCount(pantry.length);
        setFavoriteCount(favorites.length);
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name.trim().split(/\s+/)[0] || "cozinheiro";
  const greeting = useMemo(() => greetingForHour(hour ?? 12), [hour]);

  if (isLoading) {
    return <div className={styles.loading}>Preparando sua bancada…</div>;
  }

  if (hasError || !user) {
    return (
      <section className={styles.emptyState}>
        <p className={styles.eyebrow}>SUA CONTA</p>
        <h1>Essa bancada precisa de login.</h1>
        <p>Entre na sua conta para ver seu perfil, sua despensa e suas receitas salvas.</p>
        <Link className={styles.primaryAction} href="/entrar">Entrar</Link>
      </section>
    );
  }

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.avatar} aria-hidden="true">{initials(user.name)}</div>
        <div>
          <p className={styles.eyebrow}>MINHA COZINHA</p>
          <h1>{greeting.label}, {firstName}.</h1>
          <p className={styles.greeting}>{greeting.line}</p>
        </div>
      </section>

      <section className={styles.profileCard}>
        <div>
          <p className={styles.cardLabel}>SEU PERFIL</p>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.secondaryAction} disabled type="button">Editar perfil · em breve</button>
          <Link className={styles.primaryAction} href="/recuperar-senha">Alterar senha</Link>
        </div>
      </section>

      <section className={styles.stats} aria-label="Resumo da conta">
        <Link className={styles.statCard} href="/despensa">
          <span>{pantryCount}</span>
          <strong>{pantryCount === 1 ? "ingrediente na despensa" : "ingredientes na despensa"}</strong>
          <small>Ver o que já está na cozinha →</small>
        </Link>
        <Link className={styles.statCard} href="/favoritos">
          <span>{favoriteCount}</span>
          <strong>{favoriteCount === 1 ? "receita favorita" : "receitas favoritas"}</strong>
          <small>Abrir seu caderno →</small>
        </Link>
      </section>

      <section className={styles.tip}>
        <span aria-hidden="true">✦</span>
        <div>
          <strong>Uma pitada de organização ajuda.</strong>
          <p>Quanto mais completa sua despensa, melhores ficam as sugestões de receitas para o que você já tem em casa.</p>
        </div>
      </section>
    </div>
  );
}
