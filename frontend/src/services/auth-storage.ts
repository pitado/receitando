const AUTH_SESSION_HINT_KEY = "receitando.auth.session";
const LEGACY_AUTH_TOKEN_KEY = "receitando.auth.token";
export const AUTH_CHANGED_EVENT = "receitando:auth-changed";

function notifyAuthChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

function safeRemove(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Alguns navegadores móveis/modos privados podem bloquear Web Storage.
    // A credencial real continua no cookie HttpOnly.
  }
}

function safeSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // O indicador é apenas de UX; falhar aqui não deve invalidar o login.
  }
}

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function clearLegacyToken(): void {
  if (typeof window === "undefined") return;
  safeRemove(window.localStorage, LEGACY_AUTH_TOKEN_KEY);
  safeRemove(window.sessionStorage, LEGACY_AUTH_TOKEN_KEY);
}

export function markAuthSession(remember: boolean): void {
  if (typeof window === "undefined") return;

  clearLegacyToken();
  safeRemove(window.localStorage, AUTH_SESSION_HINT_KEY);
  safeRemove(window.sessionStorage, AUTH_SESSION_HINT_KEY);

  const storage = remember ? window.localStorage : window.sessionStorage;
  // Este valor é apenas um indicador de UX. A credencial real fica no cookie
  // HttpOnly e nunca é acessível ao JavaScript do frontend.
  safeSet(storage, AUTH_SESSION_HINT_KEY, "1");
  notifyAuthChange();
}

export function hasAuthSessionHint(): boolean {
  if (typeof window === "undefined") return false;
  clearLegacyToken();
  return (
    safeGet(window.localStorage, AUTH_SESSION_HINT_KEY) === "1" ||
    safeGet(window.sessionStorage, AUTH_SESSION_HINT_KEY) === "1"
  );
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;

  clearLegacyToken();
  safeRemove(window.localStorage, AUTH_SESSION_HINT_KEY);
  safeRemove(window.sessionStorage, AUTH_SESSION_HINT_KEY);
  notifyAuthChange();
}
