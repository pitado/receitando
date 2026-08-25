const test = require("node:test");
const assert = require("node:assert/strict");

const {
  compatibilityPercent,
  matchStatus,
  normalizeIngredient,
} = require("../.test-dist/lib/recipe-utils.js");

test("normaliza acentos, caixa, hífen, underscore e espaços", () => {
  assert.equal(normalizeIngredient("  Farinha-de_TRIGO   "), "farinha de trigo");
  assert.equal(normalizeIngredient("AÇÚCAR"), "acucar");
});

test("calcula compatibilidade com limites seguros", () => {
  assert.equal(compatibilityPercent(4, 4), 100);
  assert.equal(compatibilityPercent(3, 4), 75);
  assert.equal(compatibilityPercent(1, 3), 33);
  assert.equal(compatibilityPercent(0, 0), 0);
  assert.equal(compatibilityPercent(8, 4), 100);
  assert.equal(compatibilityPercent(Number.NaN, 4), 0);
  assert.equal(compatibilityPercent(2, Number.POSITIVE_INFINITY), 0);
});

test("classifica o resultado do matching nos limites esperados", () => {
  assert.equal(matchStatus(100), "READY");
  assert.equal(matchStatus(99), "ALMOST_READY");
  assert.equal(matchStatus(70), "ALMOST_READY");
  assert.equal(matchStatus(69), "NEAR");
  assert.equal(matchStatus(40), "NEAR");
  assert.equal(matchStatus(39), "EXPLORE");
});
