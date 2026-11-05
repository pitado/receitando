const test = require("node:test");
const assert = require("node:assert/strict");
const { buildPasswordResetEmail } = require("../.test-dist/lib/password-reset-email.js");

test("novo e-mail usa paleta, código e duração do Receitando", () => {
  const mail = buildPasswordResetEmail("482719");
  assert.match(mail.subject, /Receitando/);
  assert.match(mail.html, /#96462b/i);
  assert.match(mail.html, /#fbf2e8/i);
  assert.match(mail.html, /receitando/);
  assert.match(mail.html, /482719/);
  assert.match(mail.text, /482719/);
  assert.match(mail.text, /10 minutos/);
  assert.match(mail.html, /Não foi você/);
  assert.match(mail.html, /meta name="viewport"/);
  assert.doesNotMatch(mail.html, /<img\b/i);
  assert.doesNotMatch(mail.html, /{{CODE}}/);
  assert.doesNotMatch(mail.text, /{{CODE}}/);
});

test("código tem exatamente seis dígitos e nunca injeta HTML", () => {
  assert.throws(() => buildPasswordResetEmail("<script>"), /inválido/);
  assert.throws(() => buildPasswordResetEmail("12345"), /inválido/);
  assert.throws(() => buildPasswordResetEmail("1234567"), /inválido/);
});

test("HTML é legível mesmo com imagens externas bloqueadas", () => {
  const mail = buildPasswordResetEmail("000001");
  assert.match(mail.html, /000001/);
  assert.match(mail.html, /font-family:Impact/);
  assert.match(mail.html, /role="presentation"/);
  assert.match(mail.text, /https:\/\/receitando\.miguelpita\.com\.br/);
});
