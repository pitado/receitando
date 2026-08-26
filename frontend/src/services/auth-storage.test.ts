import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_CHANGED_EVENT,
  clearAuthToken,
  getAuthToken,
  saveAuthToken,
} from "./auth-storage";

const TOKEN_KEY = "receitando.auth.token";

describe("auth-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("salva sessão persistente no localStorage quando lembrar está ativo", () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");

    saveAuthToken("token-local", true);

    expect(window.localStorage.getItem(TOKEN_KEY)).toBe("token-local");
    expect(window.sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(getAuthToken()).toBe("token-local");
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: AUTH_CHANGED_EVENT }));
  });

  it("salva sessão temporária no sessionStorage", () => {
    saveAuthToken("token-session", false);

    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(TOKEN_KEY)).toBe("token-session");
    expect(getAuthToken()).toBe("token-session");
  });

  it("prioriza token persistente quando os dois storages possuem valor", () => {
    window.localStorage.setItem(TOKEN_KEY, "persistente");
    window.sessionStorage.setItem(TOKEN_KEY, "temporario");

    expect(getAuthToken()).toBe("persistente");
  });

  it("remove tokens e avisa a aplicação ao sair", () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");
    window.localStorage.setItem(TOKEN_KEY, "persistente");
    window.sessionStorage.setItem(TOKEN_KEY, "temporario");

    clearAuthToken();

    expect(getAuthToken()).toBeNull();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: AUTH_CHANGED_EVENT }));
  });
});
