"use client";
import { useState } from "react";
import { apiRequest } from "@/services/api-client";

export function CookTogetherButton({ slug, title, steps }: { slug: string; title: string; steps: string[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function create() {
    setBusy(true); setError("");
    try {
      const room = await apiRequest<{ id: string }>("/api/v2/cooking-rooms", {
        method: "POST", body: JSON.stringify({ recipeSlug: slug, title, steps })
      });
      window.location.assign("/cozinhar-junto/" + room.id);
    } catch { setError("Não foi possível criar a sala. Tente novamente."); setBusy(false); }
  }
  if (!steps.length) return null;
  return <div style={{ display: "grid", gap: ".4rem", justifyItems: "start" }}>
    <button type="button" onClick={create} disabled={busy} style={{ background: "#96462B", color: "#FBF2E8", border: 0, borderRadius: "12px", padding: ".8rem 1.1rem", fontWeight: 750, cursor: "pointer" }}>
      {busy ? "Criando sala..." : "🍳 Cozinhar junto"}
    </button>
    {error && <p role="alert" style={{ color: "#a52828" }}>{error}</p>}
  </div>;
}
