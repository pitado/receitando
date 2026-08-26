const test = require("node:test");
const assert = require("node:assert/strict");

const catalogWorker = require("../.test-dist/catalog64-worker.js").default;

function normalizeSql(sql) {
  return sql.replace(/\s+/g, " ").trim();
}

function createDb(handler = async () => undefined) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      const normalized = normalizeSql(sql);
      let args = [];
      const statement = {
        bind(...values) {
          args = values;
          return statement;
        },
        async first() {
          calls.push({ op: "first", sql: normalized, args });
          return (await handler({ op: "first", sql: normalized, args })) ?? null;
        },
        async all() {
          calls.push({ op: "all", sql: normalized, args });
          return { results: (await handler({ op: "all", sql: normalized, args })) ?? [] };
        },
        async run() {
          calls.push({ op: "run", sql: normalized, args });
          return (await handler({ op: "run", sql: normalized, args })) ?? { success: true };
        },
      };
      return statement;
    },
  };
}

function env(db) {
  return {
    db,
    FRONTEND_URL: "https://app.example.test",
    RESEND_API_KEY: "",
    EMAIL_FROM: "",
  };
}

function request(path, init = {}) {
  return new Request(`https://api.example.test${path}`, init);
}

test("matching resolve variação canônica e não penaliza ingrediente básico", async () => {
  const db = createDb(async ({ op, sql }) => {
    if (op === "all" && sql.startsWith("SELECT id FROM ingredients WHERE normalized_name IN")) {
      return [{ id: "ing-cebola" }];
    }
    if (op === "all" && sql.startsWith("SELECT ingredient_id AS id FROM ingredient_aliases")) {
      return [];
    }
    if (op === "all" && sql.includes("COUNT(DISTINCT ri.ingredient_id) AS foundCount")) {
      assert.ok(sql.includes("i.is_staple = 0"));
      return [{ recipeId: "recipe-1", foundCount: 1 }];
    }
    if (op === "all" && sql.startsWith("SELECT id, title, slug")) {
      return [{
        id: "recipe-1",
        title: "Cebola assada",
        slug: "cebola-assada",
        description: "Teste",
        instructions: "Asse.",
        prepMinutes: 20,
        servings: 2,
        mealType: "acompanhamento",
        difficulty: "FACIL",
        sourceType: "OPEN_DATASET",
        sourceName: "Wikilivros",
        sourceUrl: null,
        sourceAuthor: null,
        sourceLicense: "CC BY-SA 4.0",
        sourceLicenseUrl: null,
        sourceLanguage: "pt-BR",
        externalSource: "wikibooks",
        imageUrl: null,
        imageSource: null,
        imageAuthor: null,
        imagePageUrl: null,
        imageLicense: null,
        imageLicenseUrl: null,
        imageAlt: null,
      }];
    }
    if (op === "all" && sql.includes("FROM recipe_ingredients ri JOIN ingredients i")) {
      return [
        {
          recipeId: "recipe-1",
          ingredientId: "ing-cebola",
          name: "cebola",
          normalizedName: "cebola",
          category: "outros",
          quantity: 2,
          unit: "un",
          optional: 0,
          isStaple: 0,
          rawText: "2 cebolas médias picadas",
        },
        {
          recipeId: "recipe-1",
          ingredientId: "ing-sal",
          name: "sal",
          normalizedName: "sal",
          category: "outros",
          quantity: null,
          unit: null,
          optional: 0,
          isStaple: 1,
          rawText: "sal a gosto",
        },
      ];
    }
    if (op === "all" && sql.includes("FROM recipe_tags")) return [];
    return undefined;
  });

  const response = await catalogWorker.fetch(
    request("/api/recipes/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ingredients: ["Cebolas picadas"] }),
    }),
    env(db),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.length, 1);
  assert.equal(payload[0].compatibility, 100);
  assert.deepEqual(payload[0].missingIngredients, []);
  assert.deepEqual(payload[0].foundIngredients, [{ id: "ing-cebola", name: "cebola" }]);
  assert.deepEqual(payload[0].stapleIngredients, [{ id: "ing-sal", name: "sal" }]);

  const directLookup = db.calls.find((call) => call.sql.startsWith("SELECT id FROM ingredients WHERE normalized_name IN"));
  assert.ok(directLookup.args.includes("cebola"));
  assert.ok(directLookup.args.includes("cebolas picadas"));
});

test("busca de receitas usa FTS5 em vez de LIKE com curinga inicial", async () => {
  const db = createDb(async ({ op, sql }) => {
    if (op === "all" && sql.includes("FROM recipe_search")) return [];
    return undefined;
  });

  const response = await catalogWorker.fetch(request("/api/recipes?q=bolo%20chocolate"), env(db));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);

  const searchCall = db.calls.find((call) => call.sql.includes("FROM recipe_search"));
  assert.ok(searchCall);
  assert.ok(searchCall.sql.includes("recipe_search MATCH ?"));
  assert.equal(searchCall.sql.includes("LIKE"), false);
  assert.equal(searchCall.args[0], '"bolo"* AND "chocolate"*');
});
