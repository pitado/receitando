import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_CHANGED_EVENT,
  clearAuthSession,
  hasAuthSessionHint,
  markAuthSession,
} from "./auth-storage";

const SESSION_HINT_KEY = "receitando.auth.session";
const LEGACY_TOKEN_KEY = "receitando.auth.token";

describe("auth-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("guarda apenas um indicador não sensível no localStorage quando lembrar está ativo", () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");

    markAuthSession(true);

    expect(window.localStorage.getItem(SESSION_HINT_KEY)).toBe("1");
    expect(window.sessionStorage.getItem(SESSION_HINT_KEY)).toBeNull();
    expect(window.localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
    expect(hasAuthSessionHint()).toBe(true);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: AUTH_CHANGED_EVENT }));
  });

  it("usa sessionStorage apenas para o indicador quando a sessão não deve persistir", () => {
    markAuthSession(false);

    expect(window.localStorage.getItem(SESSION_HINT_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(SESSION_HINT_KEY)).toBe("1");
    expect(hasAuthSessionHint()).toBe(true);
  });

  it("remove automaticamente tokens legados ao consultar o estado da sessão", () => {
    window.localStorage.setItem(LEGACY_TOKEN_KEY, "token-antigo");
    window.sessionStorage.setItem(LEGACY_TOKEN_KEY, "outro-token-antigo");

    expect(hasAuthSessionHint()).toBe(false);
    expect(window.localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
  });

  it("limpa indicadores e credenciais legadas ao sair", () => {
    const dispatch = vi.spyOn(window, "dispatchEvent");
    window.localStorage.setItem(SESSION_HINT_KEY, "1");
    window.localStorage.setItem(LEGACY_TOKEN_KEY, "token-antigo");

    clearAuthSession();

    expect(hasAuthSessionHint()).toBe(false);
    expect(window.localStorage.getItem(LEGACY_TOKEN_KEY)).toBeNull();
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: AUTH_CHANGED_EVENT }));
  });
});
