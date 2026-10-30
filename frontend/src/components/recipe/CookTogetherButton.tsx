"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { apiRequest } from "@/services/api-client";

import styles from "./CookTogetherButton.module.css";

export function CookTogetherButton({ slug, title, steps }: { slug: string; title: string; steps: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const room = await apiRequest<{ id: string }>("/api/v2/cooking-rooms", {
        method: "POST",
        body: JSON.stringify({ recipeSlug: slug, title, steps }),
      });
      router.push("/cozinhar-junto/" + encodeURIComponent(room.id));
    } catch {
      setError("Não foi possível criar a sala. Tente novamente.");
      setBusy(false);
    }
  }

  if (!steps.length) return null;

  return (
    <section aria-label="Cozinhar junto" className={styles.card}>
      <div aria-hidden="true" className={styles.symbol}>✳</div>
      <div className={styles.copy}>
        <span className={styles.eyebrow}>COZINHA COMPARTILHADA</span>
        <h2>Cozinhar junto é mais gostoso.</h2>
        <p>Abra uma sala, envie o convite e acompanhem cada etapa ao mesmo tempo.</p>
        <span className={styles.detail}><span aria-hidden="true">●</span> Até 12 participantes · Progresso ao vivo</span>
      </div>
      <div className={styles.action}>
        <button type="button" onClick={() => void create()} disabled={busy}>
          {busy ? "Preparando sala..." : "Começar juntos"} <span aria-hidden="true">↗</span>
        </button>
        {error ? <p role="alert">{error}</p> : null}
      </div>
    </section>
  );
}
