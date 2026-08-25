import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/auth-storage", () => ({
  getAuthToken: vi.fn(),
}));

import { getAuthToken } from "@/services/auth-storage";

import { ApiError, apiRequest } from "./api-client";

const getAuthTokenMock = vi.mocked(getAuthToken);
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
    getAuthTokenMock.mockReturnValue(null);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("monta a URL, desabilita cache e envia headers JSON", async () => {
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
        headers: expect.objectContaining({
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("adiciona Bearer token quando existe sessão", async () => {
    getAuthTokenMock.mockReturnValue("session-token");
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValue(mockResponse({ id: "1" }));

    await apiRequest("/api/auth/me");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer session-token",
        }),
      }),
    );
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

    await expect(apiRequest("/api/test")).rejects.toEqual(
      expect.objectContaining<ApiError>({
        kind: "invalid-response",
        status: 200,
      }),
    );
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
