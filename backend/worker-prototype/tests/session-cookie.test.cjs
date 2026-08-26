const test = require("node:test");
const assert = require("node:assert/strict");

const {
  PROD_SESSION_COOKIE,
  DEV_SESSION_COOKIE,
  buildExpiredSessionCookies,
  buildSessionCookie,
  isUnsafeMethod,
  sessionTokenFromCookie,
} = require("../.test-dist/lib/session-cookie.js");

test("cookie de produção é HttpOnly, Secure e SameSite Strict", () => {
  const request = new Request("https://api.receitando.miguelpita.com.br/api/auth/login");
  const cookie = buildSessionCookie(request, "token-seguro", true);

  assert.match(cookie, new RegExp(`^${PROD_SESSION_COOKIE}=token-seguro`));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Path=\//);
  assert.match(cookie, /Max-Age=2592000/);
});

test("sessão não lembrada vira cookie de sessão sem Max-Age", () => {
  const request = new Request("https://api.receitando.miguelpita.com.br/api/auth/login");
  const cookie = buildSessionCookie(request, "token-seguro", false);

  assert.doesNotMatch(cookie, /Max-Age=/);
});

test("ambiente local usa cookie de desenvolvimento sem Secure", () => {
  const request = new Request("http://localhost:8787/api/auth/login");
  const cookie = buildSessionCookie(request, "local-token", true);

  assert.match(cookie, new RegExp(`^${DEV_SESSION_COOKIE}=local-token`));
  assert.doesNotMatch(cookie, /; Secure/);
  assert.match(cookie, /HttpOnly/);
});

test("lê sessão do cookie", () => {
  const request = new Request("https://api.receitando.miguelpita.com.br/api/auth/me", {
    headers: { Cookie: `${PROD_SESSION_COOKIE}=abc123; theme=light` },
  });

  assert.equal(sessionTokenFromCookie(request), "abc123");
});

test("logout expira o cookie de produção", () => {
  const request = new Request("https://api.receitando.miguelpita.com.br/api/auth/logout");
  const cookies = buildExpiredSessionCookies(request);

  assert.ok(cookies.some((cookie) => cookie.startsWith(`${PROD_SESSION_COOKIE}=`)));
  assert.ok(cookies.every((cookie) => cookie.includes("Max-Age=0")));
});

test("proteção CSRF classifica métodos mutáveis", () => {
  assert.equal(isUnsafeMethod("GET"), false);
  assert.equal(isUnsafeMethod("HEAD"), false);
  assert.equal(isUnsafeMethod("OPTIONS"), false);
  assert.equal(isUnsafeMethod("POST"), true);
  assert.equal(isUnsafeMethod("PATCH"), true);
  assert.equal(isUnsafeMethod("DELETE"), true);
});
