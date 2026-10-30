"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Room = { recipeSlug: string; title: string; steps: string[]; completed: boolean[]; version: number; onlineCount: number };
const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787").replace(/\/$/, "");

export default function CookingRoomPage() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [status, setStatus] = useState("Conectando...");
  const [copied, setCopied] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (!id) return;
    let disposed = false, retry: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const connect = () => {
      if (disposed) return;
      setStatus("Conectando...");
      const url = API.replace(/^http/, "ws") + "/api/v2/cooking-rooms/" + encodeURIComponent(id) + "/ws";
      const ws = new WebSocket(url);
      socket.current = ws;
      ws.onopen = () => { attempts = 0; setStatus("Conectado"); };
      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "room:state") setRoom(data as Room);
          if (data.type === "presence:update") setRoom(old => old ? { ...old, onlineCount: data.onlineCount } : old);
        } catch { /* Ignorar eventos inválidos */ }
      };
      ws.onerror = () => setStatus("Problema de conexão");
      ws.onclose = event => {
        if (disposed) return;
        if (event.code === 1008 || attempts >= 6) { setStatus("Sala indisponível ou conexão encerrada"); return; }
        setStatus("Reconectando...");
        retry = setTimeout(connect, Math.min(1000 * 2 ** attempts++, 12000));
      };
    };
    connect();
    return () => { disposed = true; clearTimeout(retry); socket.current?.close(); };
  }, [id]);
  function toggle(index: number) {
    if (!room || socket.current?.readyState !== WebSocket.OPEN) return;
    socket.current.send(JSON.stringify({ type: "step:set", stepIndex: index, completed: !room.completed[index] }));
  }
  async function share() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); }
    catch { setCopied(false); }
  }
  return <main className="container page-shell" style={{ maxWidth: "850px", margin: "auto", padding: "2rem 1rem", display: "grid", gap: "1.2rem" }}>
    <Link href="/receitas">← Voltar às receitas</Link>
    <p style={{ color: "#96462B", fontWeight: 800 }}>🍳 RECEITANDO JUNTOS</p>
    <h1>{room?.title ?? "Cozinhar junto"}</h1>
    <p role="status">{status}{room ? ` · ${room.onlineCount} participante(s) online` : ""}</p>
    <button type="button" onClick={share} style={{ justifySelf: "start", padding: ".75rem 1rem", borderRadius: "12px", background: "#96462B", color: "white", border: 0 }}>
      {copied ? "Link copiado!" : "Compartilhar convite"}
    </button>
    {room ? <>
      <p>Progresso: {room.completed.filter(Boolean).length} de {room.steps.length} etapas concluídas</p>
      <progress value={room.completed.filter(Boolean).length} max={room.steps.length} style={{ width: "100%", accentColor: "#96462B" }} />
      <ol style={{ display: "grid", gap: ".75rem", padding: 0, listStyle: "none" }}>
        {room.steps.map((step, index) => <li key={index}>
          <label style={{ display: "flex", gap: "1rem", alignItems: "start", background: "#FBF2E8", color: "#2B1A14", padding: "1.2rem", borderRadius: "14px", cursor: "pointer" }}>
            <input type="checkbox" checked={Boolean(room.completed[index])} onChange={() => toggle(index)} disabled={status !== "Conectado"} style={{ width: "22px", height: "22px", accentColor: "#96462B" }} />
            <span style={{ textDecoration: room.completed[index] ? "line-through" : "none" }}>{index + 1}. {step}</span>
          </label>
        </li>)}
      </ol>
      <Link href={`/receitas/${room.recipeSlug}`}>Ver receita completa e ingredientes</Link>
    </> : <p>Preparando a sala. Se o link estiver expirado, crie uma nova sala pela receita.</p>}
  </main>;
}
