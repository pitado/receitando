const test = require("node:test");
const assert = require("node:assert/strict");

const {
  hashPassword,
  sha256,
  verifyPassword,
} = require("../.test-dist/security.js");

test("hash de senha usa PBKDF2 e nunca armazena a senha em texto puro", async () => {
  const password = "uma-senha-segura-123";
  const encoded = await hashPassword(password);

  assert.match(encoded, /^pbkdf2\$100000\$/);
  assert.equal(encoded.includes(password), false);
  assert.equal(await verifyPassword(password, encoded), true);
  assert.equal(await verifyPassword("senha-incorreta", encoded), false);
});

test("sais aleatórios produzem hashes diferentes para a mesma senha", async () => {
  const first = await hashPassword("mesma-senha-123");
  const second = await hashPassword("mesma-senha-123");
  assert.notEqual(first, second);
});

test("verificação rejeita hashes inválidos ou com iterações abaixo do mínimo", async () => {
  assert.equal(await verifyPassword("abc", "invalido"), false);
  assert.equal(await verifyPassword("abc", "pbkdf2$99999$c2FsdA$aGFzaA"), false);
});

test("SHA-256 é determinístico e retorna base64url", async () => {
  const first = await sha256("token-de-sessao");
  const second = await sha256("token-de-sessao");
  assert.equal(first, second);
  assert.match(first, /^[A-Za-z0-9_-]+$/);
});
