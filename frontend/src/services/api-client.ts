import { getAuthToken } from "@/services/auth-storage";

const DEFAULT_API_URL = "http://localhost:8787";

export type ApiErrorKind = "connection" | "http" | "invalid-response";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly kind: ApiErrorKind,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, "");
}

function buildUrl(path: string): string {
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function extractApiMessage(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null || !("message" in payload)) {
    return undefined;
  }

  const message = payload.message;

  if (typeof message === "string") {
    return message;
  }

  if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
    return message.join(" ");
  }

  return undefined;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  const authToken = getAuthToken();

  try {
    response = await fetch(buildUrl(path), {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...init.headers,
      },
    });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Não foi possível se conectar à API do Receitando.",
      "connection",
    );
  }

  let payload: unknown;

  try {
    payload = response.status === 204 ? undefined : await response.json();
  } catch {
    if (response.ok) {
      throw new ApiError(
        "A API retornou uma resposta inesperada.",
        "invalid-response",
        response.status,
      );
    }
  }

  if (!response.ok) {
    throw new ApiError(
      extractApiMessage(payload) ?? "Não foi possível concluir a solicitação.",
      "http",
      response.status,
    );
  }

  return payload as T;
}
