const test = require("node:test");
const assert = require("node:assert/strict");

const {
  canonicalIngredientName,
  compatibilityPercent,
  ingredientLookupCandidates,
  matchStatus,
  normalizeIngredient,
} = require("../.test-dist/lib/recipe-utils.js");

test("normaliza acentos, caixa, hífen, underscore e espaços", () => {
  assert.equal(normalizeIngredient("  Farinha-de_TRIGO   "), "farinha de trigo");
  assert.equal(normalizeIngredient("AÇÚCAR"), "acucar");
});

test("reduz variações gramaticais e de preparo para o ingrediente canônico", () => {
  assert.equal(canonicalIngredientName("2 cebolas médias picadas"), "cebola");
  assert.equal(canonicalIngredientName("1 tomate em cubos"), "tomate");
  assert.equal(canonicalIngredientName("Ovos"), "ovo");
  assert.equal(canonicalIngredientName("1 xícara de farinha de trigo"), "farinha de trigo");
});

test("não colapsa ingredientes semanticamente diferentes", () => {
  assert.equal(canonicalIngredientName("óleo de gergelim torrado"), "oleo de gergelim torrado");
  assert.equal(canonicalIngredientName("açúcar de confeiteiro"), "acucar de confeiteiro");
});

test("gera candidatos exatos sem depender de LIKE parcial", () => {
  assert.deepEqual(
    ingredientLookupCandidates("Cebolas picadas"),
    ["cebolas picadas", "cebola"],
  );
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
