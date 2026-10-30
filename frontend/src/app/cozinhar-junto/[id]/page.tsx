"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { CookingRoomConnection, type CookingRoom, type ConnectionStatus } from "@/services/cooking-room-connection";

export default function CookingRoomPage() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<CookingRoom | null>(null);
  const [status, setStatus] = useState("Conectando...");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const connection = useRef<CookingRoomConnection | null>(null);
  useEffect(() => {
    if (!id) return;
    const client = new CookingRoomConnection(id, {
      onRoom: setRoom,
      onStatus: (state, message) => { setConnectionStatus(state); setStatus(message); },
    });
    connection.current = client;
    return () => { client.dispose(); connection.current = null; };
  }, [id]);
  function toggle(index: number) {
    if (room) connection.current?.setStep(index, !room.completed[index]);
  }
  async function share() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setShareError(false); }
    catch { setCopied(false); setShareError(true); }
  }
  return <main className="container page-shell" style={{ maxWidth: "850px", margin: "auto", padding: "2rem 1rem", display: "grid", gap: "1.2rem" }}>
    <Link href="/receitas">← Voltar às receitas</Link>
    <p style={{ color: "#96462B", fontWeight: 800 }}>🍳 RECEITANDO JUNTOS</p>
    <h1>{room?.title ?? "Cozinhar junto"}</h1>
    <p role="status">{status}{room && connectionStatus === "connected" ? ` · ${room.onlineCount} participante(s) online` : ""}</p>
    {(connectionStatus === "unavailable" || connectionStatus === "offline") && <button type="button" onClick={() => connection.current?.retry()}>Tentar reconectar</button>}
    <button type="button" onClick={share} style={{ justifySelf: "start", padding: ".75rem 1rem", borderRadius: "12px", background: "#96462B", color: "white", border: 0 }}>
      {copied ? "Link copiado!" : "Compartilhar convite"}
    </button>
    {shareError && <p role="alert">Não foi possível copiar. Copie o endereço desta página para convidar outra pessoa.</p>}
    {room ? <>
      <p>Progresso: {room.completed.filter(Boolean).length} de {room.steps.length} etapas concluídas</p>
      <progress value={room.completed.filter(Boolean).length} max={room.steps.length} style={{ width: "100%", accentColor: "#96462B" }} />
      <ol style={{ display: "grid", gap: ".75rem", padding: 0, listStyle: "none" }}>
        {room.steps.map((step, index) => <li key={index}>
          <label style={{ display: "flex", gap: "1rem", alignItems: "start", background: "#FBF2E8", color: "#2B1A14", padding: "1.2rem", borderRadius: "14px", cursor: "pointer" }}>
            <input type="checkbox" checked={Boolean(room.completed[index])} onChange={() => toggle(index)} disabled={connectionStatus !== "connected"} style={{ width: "22px", height: "22px", accentColor: "#96462B" }} />
            <span style={{ textDecoration: room.completed[index] ? "line-through" : "none" }}>{index + 1}. {step}</span>
          </label>
        </li>)}
      </ol>
      <Link href={`/receitas/${room.recipeSlug}`}>Ver receita completa e ingredientes</Link>
    </> : <p>As etapas aparecerão após a conexão. Se o convite expirou, crie uma nova sala pela receita.</p>}
  </main>;
}
