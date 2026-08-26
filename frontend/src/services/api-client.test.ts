import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest, setTransientBearerToken } from "./api-client";

const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

function mockResponse(
  payload: unknown,
  options: { ok?: boolean; status?: number } = {},
): Response {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe("apiRequest", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.test/";
    setTransientBearerToken(null);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    setTransientBearerToken(null);
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("monta a URL, desabilita cache e envia cookies com credentials include", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(mockResponse({ ok: true }));

    const result = await apiRequest<{ ok: boolean }>("api/test", {
      method: "POST",
      body: JSON.stringify({ value: 1 }),
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/test",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("não injeta Authorization quando não há fallback transitório", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(mockResponse({ id: "1" }));

    await apiRequest("/api/auth/me");

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.credentials).toBe("include");
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });

  it("usa Bearer apenas em memória durante compatibilidade de deploy", async () => {
    setTransientBearerToken("token-transitorio");
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(mockResponse({ id: "1" }));

    await apiRequest("/api/auth/me");

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer token-transitorio");
  });

  it("retorna undefined em respostas 204", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: vi.fn(),
    } as unknown as Response);

    await expect(apiRequest("/api/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("propaga a mensagem de erro retornada pela API", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(
      mockResponse({ message: ["Campo inválido.", "Tente novamente."] }, { ok: false, status: 400 }),
    );

    await expect(apiRequest("/api/test")).rejects.toMatchObject({
      name: "ApiError",
      kind: "http",
      status: 400,
      message: "Campo inválido. Tente novamente.",
    });
  });

  it("classifica JSON inválido em resposta de sucesso", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockRejectedValue(new SyntaxError("invalid json")),
    } as unknown as Response);

    await expect(apiRequest("/api/test")).rejects.toMatchObject({
      name: "ApiError",
      kind: "invalid-response",
      status: 200,
      message: "A API retornou uma resposta inesperada.",
    });
  });

  it("classifica falhas de rede como connection", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValue(new TypeError("network down"));

    await expect(apiRequest("/api/test")).rejects.toMatchObject({
      kind: "connection",
      message: "Não foi possível se conectar à API do Receitando.",
    });
  });

  it("não converte AbortError em erro de conexão", async () => {
    const abort = new DOMException("aborted", "AbortError");
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValue(abort);

    await expect(apiRequest("/api/test")).rejects.toBe(abort);
  });
});
