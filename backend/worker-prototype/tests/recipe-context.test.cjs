const test = require("node:test");
const assert = require("node:assert/strict");

const {
  compareKitchenAmounts,
  formatBaseKitchenAmount,
} = require("../.test-dist/lib/kitchen-units.js");
const {
  contextualizeAdaptation,
  inferRecipeContext,
} = require("../.test-dist/lib/recipe-context.js");
const { adaptRecipe } = require("../.test-dist/lib/recipe-adaptation.js");

test("compara quantidades equivalentes em unidades diferentes", () => {
  const comparison = compareKitchenAmounts(1, "kg", 1200, "g");
  assert.equal(comparison.status, "ENOUGH");
  assert.equal(comparison.dimension, "MASS");
  assert.equal(comparison.requiredBase, 1000);
  assert.equal(comparison.availableBase, 1200);
});

test("detecta falta parcial e formata a diferença", () => {
  const comparison = compareKitchenAmounts(2, "xícara", 300, "ml");
  assert.equal(comparison.status, "SHORT");
  assert.equal(comparison.shortageBase, 180);
  assert.equal(formatBaseKitchenAmount(comparison.shortageBase, comparison.dimension), "180 ml");
});

test("não compara massa com volume sem inventar densidade", () => {
  const comparison = compareKitchenAmounts(200, "g", 1, "xícara");
  assert.equal(comparison.status, "UNKNOWN");
});

test("infere contexto assado e doce a partir da receita", () => {
  const context = inferRecipeContext({
    title: "Bolo de chocolate",
    mealType: "Sobremesa",
    instructions: "Leve ao forno e asse até dourar.",
  });

  assert.ok(context.signals.includes("BAKED"));
  assert.ok(context.signals.includes("SWEET"));
});

test("bloqueia ovo de linhaça quando ovo é o centro da receita", () => {
  const base = adaptRecipe({
    recipeTitle: "Omelete simples",
    currentServings: 1,
    unavailableIngredients: ["ovo"],
    ingredients: [
      {
        ingredientId: "ovo",
        name: "Ovo",
        quantity: 2,
        unit: "unidade",
        rawText: "2 ovos",
      },
    ],
  });
  assert.ok(base.ingredients[0].substitution);

  const context = inferRecipeContext({
    title: "Omelete simples",
    instructions: "Bata os ovos e leve à frigideira.",
  });
  const contextual = contextualizeAdaptation(base, context);

  assert.equal(contextual.ingredients[0].substitution, null);
  assert.equal(contextual.ingredients[0].adaptedName, "Ovo");
  assert.ok(contextual.warnings.some((warning) => warning.includes("estrutural")));
  assert.ok(contextual.confidence < base.confidence);
});

test("bloqueia tomate pelado em salada fresca", () => {
  const base = adaptRecipe({
    recipeTitle: "Salada de tomate",
    currentServings: 2,
    unavailableIngredients: ["tomate"],
    ingredients: [
      {
        ingredientId: "tomate",
        name: "Tomate",
        quantity: 2,
        unit: "unidade",
        rawText: "2 tomates",
      },
    ],
  });

  const contextual = contextualizeAdaptation(
    base,
    inferRecipeContext({ title: "Salada de tomate", instructions: "Sirva cru e gelado." }),
  );

  assert.equal(contextual.ingredients[0].substitution, null);
  assert.ok(contextual.warnings.some((warning) => warning.includes("preparos crus")));
});
