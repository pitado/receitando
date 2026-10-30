import { DurableObject } from "cloudflare:workers";
import type { Env } from "./lib/worker-http";

type Room = {
  recipeSlug: string;
  title: string;
  steps: string[];
  completed: boolean[];
  version: number;
  createdAt: number;
};
const ROOM_TTL = 24 * 60 * 60 * 1000;
const MAX_CLIENTS = 12;

export class CookingRoom extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Application heartbeat without waking an idle Durable Object.
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}'));
  }

  private clients(exclude?: WebSocket) {
    return this.ctx.getWebSockets().filter(ws => ws !== exclude && ws.readyState === WebSocket.OPEN);
  }

  private broadcast(payload: unknown, exclude?: WebSocket) {
    const message = JSON.stringify(payload);
    for (const ws of this.clients(exclude)) {
      try { ws.send(message); }
      catch { ws.close(1011, "Falha ao enviar atualização"); }
    }
  }

  private presence(exclude?: WebSocket) {
    const onlineCount = this.clients(exclude).length;
    this.broadcast({ type: "presence:update", onlineCount }, exclude);
  }

  private expired(room: Room) { return Date.now() >= room.createdAt + ROOM_TTL; }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/init") {
      const data = await request.json() as Partial<Room> | null;
      if (!data || typeof data.recipeSlug !== "string" || !/^[a-z0-9-]{1,120}$/.test(data.recipeSlug) ||
          typeof data.title !== "string" || !data.title.trim() || data.title.length > 160 ||
          !Array.isArray(data.steps) || !data.steps.length || data.steps.length > 100 ||
          data.steps.some(s => typeof s !== "string" || !s.trim() || s.length > 2000)) {
        return Response.json({ message: "Receita inválida" }, { status: 400 });
      }
      const room: Room = {
        recipeSlug: data.recipeSlug, title: data.title.trim(), steps: data.steps,
        completed: data.steps.map(() => false), version: 0, createdAt: Date.now(),
      };
      const created = await this.ctx.storage.transaction(async txn => {
        if (await txn.get("room")) return false;
        await txn.put("room", room);
        await txn.setAlarm(room.createdAt + ROOM_TTL);
        return true;
      });
      return Response.json({ ok: created }, { status: created ? 201 : 409 });
    }

    const room = await this.ctx.storage.get<Room>("room");
    if (!room || this.expired(room)) {
      return Response.json({ message: "Sala não encontrada ou expirada. Crie uma nova sala pela receita." }, { status: 404 });
    }
    if (request.method === "GET" && url.pathname === "/state") {
      return Response.json({ ...room, onlineCount: this.clients().length }, { headers: { "Cache-Control": "no-store" } });
    }
    if (request.method !== "GET" || url.pathname !== "/ws") return new Response("Not found", { status: 404 });
    if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return Response.json({ message: "Conexão WebSocket necessária" }, { status: 426 });
    }
    if (this.clients().length >= MAX_CLIENTS) return Response.json({ message: "Sala cheia" }, { status: 429 });

    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].send(JSON.stringify({ type: "room:state", ...room, onlineCount: this.clients().length }));
    this.presence();
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    if (typeof raw !== "string" || raw.length > 1024) return;
    let message: { type?: string; stepIndex?: number; completed?: boolean } | null;
    try { message = JSON.parse(raw); } catch { return; }
    if (!message || message.type !== "step:set" || !Number.isInteger(message.stepIndex) || typeof message.completed !== "boolean") return;
    const index = message.stepIndex!;
    const completed = message.completed;
    try {
      // Atomic read-modify-write: simultaneous participants must not lose updates.
      const result = await this.ctx.storage.transaction(async txn => {
        const room = await txn.get<Room>("room");
        if (!room || this.expired(room)) return { expired: true } as const;
        if (index < 0 || index >= room.steps.length) return null;
        if (room.completed[index] !== completed) {
          room.completed[index] = completed;
          room.version++;
          await txn.put("room", room);
        }
        return { room };
      });
      if (!result) return;
      if ("expired" in result) { ws.close(1008, "Sala expirada"); return; }
      this.broadcast({ type: "room:state", ...result.room, onlineCount: this.clients().length });
    } catch (error) {
      console.error("cooking_room_update_failed", { error: String(error) });
      ws.close(1011, "Não foi possível salvar a etapa");
    }
  }

  webSocketClose(ws: WebSocket, code: number, reason: string): void {
    // Complete the close handshake on runtimes requiring an explicit reply.
    // On newer Cloudflare compatibility dates, calling close() is still safe.
    try {
      ws.close(code, reason);
    } catch (error) {
      console.warn("cooking_room_close_reply_failed", { code, error: String(error) });
    }
    this.presence(ws);
  }
  webSocketError(ws: WebSocket): void {
    ws.close(1011, "Conexão interrompida");
    this.presence(ws);
  }
  async alarm(): Promise<void> {
    const room = await this.ctx.storage.get<Room>("room");
    if (room && this.expired(room)) {
      for (const ws of this.clients()) ws.close(1008, "Sala expirada");
    }
  }
}
