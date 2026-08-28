const test = require("node:test");
const assert = require("node:assert/strict");

const {
  adaptRecipe,
  parseIngredientAmount,
} = require("../.test-dist/lib/recipe-adaptation.js");

test("parseIngredientAmount entende frações e unidades culinárias", () => {
  assert.deepEqual(parseIngredientAmount("1 1/2 xícaras de farinha de trigo"), {
    quantity: 1.5,
    unit: "xícara",
  });

  assert.deepEqual(parseIngredientAmount("½ litro de leite"), {
    quantity: 0.5,
    unit: "l",
  });
});

test("adaptRecipe recalcula quantidades pelo rendimento", () => {
  const result = adaptRecipe({
    recipeTitle: "Bolo",
    currentServings: 8,
    targetServings: 4,
    ingredients: [
      {
        ingredientId: "farinha",
        name: "Farinha de trigo",
        normalizedName: "farinha de trigo",
        quantity: 2,
        unit: "xícara",
        rawText: "2 xícaras de farinha de trigo",
      },
      {
        ingredientId: "leite",
        name: "Leite",
        normalizedName: "leite",
        quantity: 1,
        unit: "xícara",
        rawText: "1 xícara de leite",
      },
    ],
  });

  assert.equal(result.scaleFactor, 0.5);
  assert.equal(result.ingredients[0].adapted.quantity, 1);
  assert.equal(result.ingredients[1].adapted.quantity, 0.5);
  assert.equal(result.changes[0].type, "SCALE");
});

test("adaptRecipe sugere substituição explicável com confiança", () => {
  const result = adaptRecipe({
    recipeTitle: "Panqueca",
    currentServings: 2,
    targetServings: 2,
    unavailableIngredients: ["leite"],
    ingredients: [
      {
        ingredientId: "leite",
        name: "Leite",
        normalizedName: "leite",
        quantity: 200,
        unit: "ml",
        rawText: "200 ml de leite",
      },
    ],
  });

  const ingredient = result.ingredients[0];
  assert.equal(ingredient.unavailable, true);
  assert.equal(ingredient.adaptedName, "leite sem lactose");
  assert.equal(ingredient.substitution.recommended.confidence, "HIGH");
  assert.match(ingredient.substitution.recommended.reason, /Mantém volume/);
  assert.ok(result.confidence >= 90);
});

test("adaptRecipe sinaliza ingrediente sem substituição conhecida", () => {
  const result = adaptRecipe({
    recipeTitle: "Receita teste",
    currentServings: 2,
    unavailableIngredients: ["açafrão"],
    ingredients: [
      {
        ingredientId: "acafrao",
        name: "Açafrão",
        normalizedName: "acafrao",
        quantity: 1,
        unit: "colher (chá)",
        rawText: "1 colher de chá de açafrão",
      },
    ],
  });

  assert.equal(result.ingredients[0].substitution, null);
  assert.ok(result.ingredients[0].warnings.some((warning) => warning.includes("substituição confiável")));
  assert.equal(result.confidence, 35);
});

test("adaptRecipe não escala quando rendimento original é desconhecido", () => {
  const result = adaptRecipe({
    recipeTitle: "Receita externa",
    currentServings: 0,
    targetServings: 6,
    ingredients: [
      {
        ingredientId: "farinha",
        name: "Farinha de trigo",
        quantity: null,
        unit: null,
        rawText: "2 xícaras de farinha de trigo",
      },
    ],
  });

  assert.equal(result.scaleFactor, 1);
  assert.equal(result.ingredients[0].adapted.quantity, 2);
  assert.ok(result.warnings.some((warning) => warning.includes("rendimento original")));
});
