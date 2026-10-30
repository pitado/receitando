import { apiRequest, ApiError } from "./api-client";

export type CookingRoom = {
  recipeSlug: string;
  title: string;
  steps: string[];
  completed: boolean[];
  version: number;
  onlineCount: number;
};
export type ConnectionStatus = "connecting" | "connected" | "retrying" | "offline" | "unavailable";
type Callbacks = {
  onRoom: (room: CookingRoom) => void;
  onStatus: (status: ConnectionStatus, message: string) => void;
};
const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787").replace(/\/$/, "");
const MAX_RETRIES = 6;

function isRoom(data: unknown): data is CookingRoom {
  if (!data || typeof data !== "object") return false;
  const r = data as Partial<CookingRoom>;
  return typeof r.title === "string" && typeof r.recipeSlug === "string" &&
    Array.isArray(r.steps) && r.steps.length > 0 && r.steps.every(s => typeof s === "string") &&
    Array.isArray(r.completed) && r.completed.length === r.steps.length && r.completed.every(s => typeof s === "boolean") &&
    Number.isInteger(r.version) && Number.isInteger(r.onlineCount);
}

/** One socket per mounted room; only server-confirmed states enable editing. */
export class CookingRoomConnection {
  private socket: WebSocket | null = null;
  private request: AbortController | null = null;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private heartbeat?: ReturnType<typeof setInterval>;
  private watchdog?: ReturnType<typeof setTimeout>;
  private disposed = false;
  private generation = 0;
  private attempts = 0;
  private ready = false;
  private room: CookingRoom | null = null;

  constructor(private id: string, private callbacks: Callbacks) {
    window.addEventListener("online", this.retry);
    window.addEventListener("offline", this.offline);
    void this.connect();
  }

  private status(status: ConnectionStatus, message: string) {
    this.ready = status === "connected";
    this.callbacks.onStatus(status, message);
  }

  private clearConnection() {
    this.generation++;
    this.request?.abort();
    clearTimeout(this.retryTimer);
    clearTimeout(this.watchdog);
    clearInterval(this.heartbeat);
    this.heartbeat = undefined;
    const ws = this.socket;
    this.socket = null;
    // Detach before closing: stale sockets must not schedule new retries.
    if (ws) {
      ws.onopen = ws.onclose = ws.onerror = ws.onmessage = null;
      ws.close();
    }
    this.ready = false;
  }

  private offline = () => {
    this.clearConnection();
    this.status("offline", "Sem conexão. Reconectaremos quando a internet voltar.");
  };

  retry = () => {
    if (this.disposed) return;
    this.attempts = 0;
    void this.connect();
  };

  private retryLater() {
    this.clearConnection();
    if (this.disposed) return;
    if (!navigator.onLine) { this.offline(); return; }
    if (this.attempts >= MAX_RETRIES) {
      this.status("unavailable", "Não foi possível reconectar. Tente novamente.");
      return;
    }
    this.status("retrying", "Reconectando… Suas etapas salvas serão recuperadas.");
    this.retryTimer = setTimeout(() => { void this.connect(); }, Math.min(1000 * 2 ** this.attempts++, 12000));
  }

  private async connect() {
    this.clearConnection();
    if (this.disposed) return;
    if (!navigator.onLine) { this.offline(); return; }
    if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(this.id)) {
      this.status("unavailable", "Convite inválido. Crie uma nova sala pela receita.");
      return;
    }
    const generation = this.generation;
    const current = () => !this.disposed && generation === this.generation;
    this.status("connecting", "Conectando…");
    const abort = new AbortController();
    this.request = abort;
    this.watchdog = setTimeout(() => { if (current()) this.retryLater(); }, 15000);
    try {
      // Browsers hide failed WebSocket handshake status; HTTP gives actionable errors.
      const initial = await apiRequest<CookingRoom>(`/api/v2/cooking-rooms/${this.id}`, { signal: abort.signal });
      if (!current()) return;
      if (!isRoom(initial)) throw new Error("Estado de sala inválido");
      this.room = initial;
      this.callbacks.onRoom(initial);
      const url = new URL(`${API}/api/v2/cooking-rooms/${this.id}/ws`, window.location.href);
      url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(url.toString());
      this.socket = ws;
      ws.onmessage = event => {
        if (!current()) return;
        let data;
        try { data = JSON.parse(event.data); } catch { return; }
        if (!data || typeof data !== "object") return;
        if (data.type === "room:state" && isRoom(data)) {
          if (this.room && data.version < this.room.version) return;
          this.room = data;
          this.callbacks.onRoom(data);
          this.attempts = 0;
          clearTimeout(this.watchdog);
          this.status("connected", "Conectado");
          if (!this.heartbeat) this.startHeartbeat(ws, current);
        } else if (data.type === "presence:update" && this.room && Number.isInteger(data.onlineCount)) {
          this.room = { ...this.room, onlineCount: data.onlineCount };
          this.callbacks.onRoom(this.room);
        } else if (data.type === "pong") {
          clearTimeout(this.watchdog);
        }
      };
      ws.onerror = () => { /* onclose drives recovery; do not create duplicate sockets. */ };
      ws.onclose = event => {
        if (!current()) return;
        if (event.code === 1008) {
          this.clearConnection();
          this.status("unavailable", "Sala encerrada ou expirada. Crie uma nova sala pela receita.");
        } else this.retryLater();
      };
    } catch (error) {
      if (!current()) return;
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
        this.clearConnection();
        this.status("unavailable", error.status === 404
          ? "Sala não encontrada ou expirada. Crie uma nova sala pela receita."
          : "O acesso à sala foi bloqueado. Tente novamente mais tarde.");
      } else this.retryLater();
    }
  }

  private startHeartbeat(ws: WebSocket, current: () => boolean) {
    this.heartbeat = setInterval(() => {
      if (!current() || ws.readyState !== WebSocket.OPEN) return;
      try {
        ws.send('{"type":"ping"}');
        this.watchdog = setTimeout(() => { if (current()) this.retryLater(); }, 10000);
      } catch { this.retryLater(); }
    }, 20000);
  }

  setStep(index: number, completed: boolean) {
    if (!this.ready || this.socket?.readyState !== WebSocket.OPEN) return;
    try { this.socket.send(JSON.stringify({ type: "step:set", stepIndex: index, completed })); }
    catch { this.retryLater(); }
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener("online", this.retry);
    window.removeEventListener("offline", this.offline);
    this.clearConnection();
  }
}
