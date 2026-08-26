export const PROD_SESSION_COOKIE = "__Host-receitando_session";
export const DEV_SESSION_COOKIE = "receitando_session_dev";

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

function parseCookieHeader(value: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!value) return cookies;

  for (const pair of value.split(";")) {
    const index = pair.indexOf("=");
    if (index <= 0) continue;
    const name = pair.slice(0, index).trim();
    const rawValue = pair.slice(index + 1).trim();
    if (!name) continue;
    try {
      cookies.set(name, decodeURIComponent(rawValue));
    } catch {
      cookies.set(name, rawValue);
    }
  }

  return cookies;
}

export function sessionTokenFromCookie(request: Request): string | undefined {
  const cookies = parseCookieHeader(request.headers.get("Cookie"));
  return cookies.get(PROD_SESSION_COOKIE) ?? cookies.get(DEV_SESSION_COOKIE) ?? undefined;
}

export function buildSessionCookie(request: Request, token: string, remember: boolean): string {
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  const name = secure ? PROD_SESSION_COOKIE : DEV_SESSION_COOKIE;
  const attributes = [
    `${name}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
  ];

  if (secure) attributes.push("Secure");
  if (remember) attributes.push(`Max-Age=${SESSION_MAX_AGE_SECONDS}`);

  return attributes.join("; ");
}

export function buildExpiredSessionCookies(request: Request): string[] {
  const secure = new URL(request.url).protocol === "https:";
  const common = ["Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
  const production = [
    `${PROD_SESSION_COOKIE}=`,
    ...common,
    "Secure",
  ].join("; ");
  const development = [
    `${DEV_SESSION_COOKIE}=`,
    ...common,
  ].join("; ");

  return secure ? [production, development] : [development];
}

export function isUnsafeMethod(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}
