const test = require("node:test");
const assert = require("node:assert/strict");
const { buildPasswordResetEmail } = require("../.test-dist/lib/password-reset-email.js");

test("mensagem de recuperação usa identidade e código corretos", () => {
  const email = buildPasswordResetEmail("012345");
  assert.equal(email.subject, "Seu código de recuperação | Receitando");
  assert.match(email.text, /012345/);
  assert.match(email.html, /012345/);
  assert.match(email.html, /#96462B/i);
  assert.match(email.html, /#FBF2E8/i);
  assert.match(email.html, /receitando/);
  assert.match(email.text, /10 minutos/);
  assert.match(email.html, /10 minutos/);
  assert.match(email.html, /lang="pt-BR"/);
  assert.doesNotMatch(email.html, /<img\b/i);
});

test("não aceita código inválido ou vazio", () => {
  for (const code of ["", "123", "1234567", "123abc", "<b>123</b>"]) {
    assert.throws(() => buildPasswordResetEmail(code));
  }
});
