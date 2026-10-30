type Room = { recipeSlug: string; title: string; steps: string[]; completed: boolean[]; version: number; createdAt: number };
type Client = { name: string };
export class CookingRoom {
  private sockets = new Map<WebSocket, Client>();
  constructor(private state: DurableObjectState) {}
  private async room(): Promise<Room | undefined> { return this.state.storage.get<Room>("room"); }
  private broadcast(payload: unknown) {
    const message = JSON.stringify(payload);
    for (const socket of this.sockets.keys()) {
      try { socket.send(message); } catch { this.sockets.delete(socket); }
    }
  }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/init") {
      if (await this.room()) return Response.json({ error: "Sala já existe" }, { status: 409 });
      const data = await request.json() as Partial<Room>;
      if (!data.recipeSlug || !data.title || !Array.isArray(data.steps) || !data.steps.length || data.steps.length > 100 ||
          data.steps.some(s => typeof s !== "string" || s.length > 2000)) return Response.json({ error: "Receita inválida" }, { status: 400 });
      const room: Room = { recipeSlug: data.recipeSlug, title: data.title.slice(0, 160), steps: data.steps, completed: data.steps.map(() => false), version: 0, createdAt: Date.now() };
      await this.state.storage.put("room", room);
      return Response.json({ ok: true }, { status: 201 });
    }
    const room = await this.room();
    if (!room || Date.now() - room.createdAt > 24 * 60 * 60 * 1000) return Response.json({ error: "Sala não encontrada ou expirada" }, { status: 404 });
    if (request.method === "GET" && url.pathname === "/state") return Response.json({ ...room, onlineCount: this.sockets.size });
    if (request.method !== "GET" || url.pathname !== "/ws" || request.headers.get("Upgrade")?.toLowerCase() !== "websocket") return new Response("Not found", { status: 404 });
    if (this.sockets.size >= 12) return new Response("Sala cheia", { status: 429 });
    const pair = new WebSocketPair();
    const client = pair[0], server = pair[1];
    server.accept();
    const name = (url.searchParams.get("name") || "Convidado").slice(0, 30);
    this.sockets.set(server, { name });
    server.send(JSON.stringify({ type: "room:state", ...room, onlineCount: this.sockets.size }));
    this.broadcast({ type: "presence:update", onlineCount: this.sockets.size });
    server.addEventListener("message", async event => {
      try {
        if (typeof event.data !== "string" || event.data.length > 1024) return;
        const message = JSON.parse(event.data) as { type?: string; stepIndex?: number; completed?: boolean };
        if (message.type !== "step:set" || !Number.isInteger(message.stepIndex) || typeof message.completed !== "boolean") return;
        const latest = await this.room();
        if (!latest || message.stepIndex! < 0 || message.stepIndex! >= latest.steps.length) return;
        latest.completed[message.stepIndex!] = message.completed;
        latest.version++;
        await this.state.storage.put("room", latest);
        this.broadcast({ type: "room:state", ...latest, onlineCount: this.sockets.size });
      } catch { /* Ignorar mensagens malformadas */ }
    });
    const leave = () => { this.sockets.delete(server); this.broadcast({ type: "presence:update", onlineCount: this.sockets.size }); };
    server.addEventListener("close", leave);
    server.addEventListener("error", leave);
    return new Response(null, { status: 101, webSocket: client });
  }
}
