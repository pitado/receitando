const AUTH_SESSION_HINT_KEY = "receitando.auth.session";
const LEGACY_AUTH_TOKEN_KEY = "receitando.auth.token";
export const AUTH_CHANGED_EVENT = "receitando:auth-changed";

function notifyAuthChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

function clearLegacyToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
  window.sessionStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
}

export function markAuthSession(remember: boolean): void {
  if (typeof window === "undefined") return;

  clearLegacyToken();
  window.localStorage.removeItem(AUTH_SESSION_HINT_KEY);
  window.sessionStorage.removeItem(AUTH_SESSION_HINT_KEY);

  const storage = remember ? window.localStorage : window.sessionStorage;
  // Este valor é apenas um indicador de UX. A credencial real fica no cookie
  // HttpOnly e nunca é acessível ao JavaScript do frontend.
  storage.setItem(AUTH_SESSION_HINT_KEY, "1");
  notifyAuthChange();
}

export function hasAuthSessionHint(): boolean {
  if (typeof window === "undefined") return false;
  clearLegacyToken();
  return (
    window.localStorage.getItem(AUTH_SESSION_HINT_KEY) === "1" ||
    window.sessionStorage.getItem(AUTH_SESSION_HINT_KEY) === "1"
  );
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") return;

  clearLegacyToken();
  window.localStorage.removeItem(AUTH_SESSION_HINT_KEY);
  window.sessionStorage.removeItem(AUTH_SESSION_HINT_KEY);
  notifyAuthChange();
}

// Compatibilidade temporária com componentes que verificam apenas a existência
// de uma sessão conhecida. Nenhuma credencial é retornada ou persistida aqui.
export function getAuthToken(): string | null {
  return hasAuthSessionHint() ? "http-only-cookie-session" : null;
}

export function clearAuthToken(): void {
  clearAuthSession();
}
