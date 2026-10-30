import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiRequest } from "./api-client";
import { CookingRoomConnection } from "./cooking-room-connection";

vi.mock("./api-client", async importOriginal => ({
  ...await importOriginal<typeof import("./api-client")>(), apiRequest: vi.fn(),
}));
const id = "11111111-1111-4111-8111-111111111111";
const room = { recipeSlug: "teste", title: "Teste", steps: ["A", "B"], completed: [false, false], version: 0, onlineCount: 1 };
class Socket {
  static OPEN = 1;
  static instances: Socket[] = [];
  readyState = 1;
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => { this.readyState = 3; });
  constructor(public url: string) { Socket.instances.push(this); }
  message(data: unknown) { this.onmessage?.({ data: JSON.stringify(data) }); }
}
const onRoom = vi.fn(), onStatus = vi.fn();
let client: CookingRoomConnection;
async function start() {
  client = new CookingRoomConnection(id, { onRoom, onStatus });
  await vi.advanceTimersByTimeAsync(0);
  return Socket.instances.at(-1)!;
}
function connect(socket: Socket, state = room) { socket.message({ type: "room:state", ...state }); }

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  Socket.instances = [];
  vi.stubGlobal("WebSocket", Socket);
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  vi.mocked(apiRequest).mockResolvedValue(structuredClone(room));
});
afterEach(() => { client?.dispose(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("CookingRoomConnection", () => {
  it("só habilita alterações após receber estado pelo socket", async () => {
    const socket = await start();
    client.setStep(0, true);
    expect(socket.send).not.toHaveBeenCalled();
    connect(socket);
    client.setStep(0, true);
    expect(socket.send).toHaveBeenCalledWith('{"type":"step:set","stepIndex":0,"completed":true}');
    expect(onStatus).toHaveBeenLastCalledWith("connected", "Conectado");
  });
  it("recupera estado após queda e retoma heartbeat na nova conexão", async () => {
    const socket = await start(); connect(socket);
    socket.onclose?.({ code: 1006 });
    client.setStep(0, true);
    expect(socket.send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    const next = Socket.instances.at(-1)!;
    expect(next).not.toBe(socket);
    connect(next, { ...room, version: 1, completed: [true, false] });
    expect(onRoom).toHaveBeenLastCalledWith(expect.objectContaining({ completed: [true, false] }));
    await vi.advanceTimersByTimeAsync(20000);
    expect(next.send).toHaveBeenCalledWith('{"type":"ping"}');
    next.message({ type: "pong" });
    await vi.advanceTimersByTimeAsync(10000);
    expect(next.close).not.toHaveBeenCalled();
  });
  it("detecta uma conexão silenciosamente perdida por heartbeat", async () => {
    const socket = await start(); connect(socket);
    await vi.advanceTimersByTimeAsync(30000);
    expect(socket.close).toHaveBeenCalled();
    expect(onStatus).toHaveBeenLastCalledWith("retrying", expect.any(String));
  });
  it("para ao receber 404 e permite tentativa manual", async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new ApiError("expired", "http", 404));
    await start();
    expect(onStatus).toHaveBeenLastCalledWith("unavailable", expect.stringContaining("expirada"));
    await vi.advanceTimersByTimeAsync(60000);
    expect(Socket.instances).toHaveLength(0);
    client.retry(); await vi.advanceTimersByTimeAsync(0);
    expect(Socket.instances).toHaveLength(1);
  });
  it("não insiste num acesso HTTP bloqueado", async () => {
    vi.mocked(apiRequest).mockRejectedValue(new ApiError("blocked", "http", 403));
    await start(); await vi.advanceTimersByTimeAsync(60000);
    expect(apiRequest).toHaveBeenCalledTimes(1);
    expect(onStatus).toHaveBeenLastCalledWith("unavailable", expect.stringContaining("bloqueado"));
  });
  it("para as tentativas após seis falhas transitórias", async () => {
    vi.mocked(apiRequest).mockRejectedValue(new ApiError("offline", "connection"));
    await start(); await vi.advanceTimersByTimeAsync(60000);
    expect(apiRequest).toHaveBeenCalledTimes(7);
    expect(onStatus).toHaveBeenLastCalledWith("unavailable", expect.any(String));
  });
  it("trata offline/online sem manter sockets antigos", async () => {
    const socket = await start(); connect(socket);
    window.dispatchEvent(new Event("offline"));
    expect(socket.close).toHaveBeenCalled();
    expect(onStatus).toHaveBeenLastCalledWith("offline", expect.any(String));
    window.dispatchEvent(new Event("online")); await vi.advanceTimersByTimeAsync(0);
    expect(Socket.instances).toHaveLength(2);
  });
  it("cancela timers e eventos ao desmontar", async () => {
    const socket = await start(); connect(socket);
    client.dispose();
    window.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(60000);
    expect(Socket.instances).toHaveLength(1);
    expect(socket.send).not.toHaveBeenCalled();
  });
  it("ignora mensagens inválidas e versões atrasadas", async () => {
    const socket = await start();
    socket.onmessage?.({ data: "not-json" }); socket.message(null);
    connect(socket, { ...room, version: 2, completed: [true, true] });
    connect(socket);
    expect(onRoom).toHaveBeenLastCalledWith(expect.objectContaining({ version: 2 }));
    socket.message({ type: "presence:update", onlineCount: 2 });
    expect(onRoom).toHaveBeenLastCalledWith(expect.objectContaining({ onlineCount: 2, version: 2 }));
  });
  it("trata encerramento por política como terminal", async () => {
    const socket = await start(); connect(socket);
    socket.onclose?.({ code: 1008 });
    await vi.advanceTimersByTimeAsync(60000);
    expect(Socket.instances).toHaveLength(1);
    expect(onStatus).toHaveBeenLastCalledWith("unavailable", expect.stringContaining("expirada"));
  });
  it("recusa convite malformado antes de acessar a API", async () => {
    client = new CookingRoomConnection("invalid", { onRoom, onStatus });
    expect(apiRequest).not.toHaveBeenCalled();
    expect(onStatus).toHaveBeenLastCalledWith("unavailable", expect.stringContaining("inválido"));
  });
  it("recupera handshake sem resposta e falha de envio", async () => {
    const socket = await start();
    await vi.advanceTimersByTimeAsync(15000);
    expect(socket.close).toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);
    const next = Socket.instances.at(-1)!; connect(next);
    next.send.mockImplementation(() => { throw new Error("closed"); });
    client.setStep(0, true);
    expect(onStatus).toHaveBeenLastCalledWith("retrying", expect.any(String));
  });
});
