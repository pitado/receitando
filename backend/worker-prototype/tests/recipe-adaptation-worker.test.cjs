const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const recipeAdaptationWorker = require("../.test-dist/recipe-adaptation-worker.js").default;

function normalizeSql(sql) {
  return sql.replace(/\s+/g, " ").trim();
}

function createDb() {
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
          if (normalized.includes("FROM recipes") && normalized.includes("WHERE slug = ?")) {
            return {
              id: "recipe-1",
              title: "Bolo simples",
              servings: 4,
              mealType: "Sobremesa",
              instructions: "Misture e asse no forno.",
            };
          }
          return null;
        },
        async all() {
          calls.push({ op: "all", sql: normalized, args });
          if (normalized.includes("FROM recipe_ingredients ri")) return { results: [] };
          if (normalized.includes("FROM recipe_tags")) return { results: [{ tag: "bolo" }] };
          return { results: [] };
        },
      };
      return statement;
    },
  };
}

test("motor lê tags de recipe_tags em vez de uma coluna inexistente em recipes", async () => {
  const db = createDb();
  const origin = "https://receitando.miguellpitaa.workers.dev";
  const response = await recipeAdaptationWorker.fetch(
    new Request("https://api.receitando.miguelpita.com.br/api/recipes/bolo-simples/adapt", {
      method: "POST",
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ unavailableIngredients: [] }),
    }),
    {
      db,
      FRONTEND_URL: `https://receitando.miguelpita.com.br,${origin}`,
    },
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), origin);

  const recipeQuery = db.calls.find(
    (call) => call.op === "first" && call.sql.includes("FROM recipes") && call.sql.includes("WHERE slug = ?"),
  );
  assert.ok(recipeQuery);
  assert.doesNotMatch(recipeQuery.sql, /\btags\b/);
  assert.ok(db.calls.some((call) => call.op === "all" && call.sql.includes("FROM recipe_tags")));

  const payload = await response.json();
  assert.ok(payload.culinaryContext.signals.includes("BAKED"));
  assert.ok(payload.culinaryContext.signals.includes("SWEET"));
});

test("configuração de produção mantém os domínios usados pela interface no CORS", () => {
  const wrangler = fs.readFileSync(path.join(__dirname, "..", "wrangler.jsonc"), "utf8");
  assert.match(wrangler, /https:\/\/receitando\.miguelpita\.com\.br/);
  assert.match(wrangler, /https:\/\/www\.receitando\.miguelpita\.com\.br/);
  assert.match(wrangler, /https:\/\/receitando\.miguellpitaa\.workers\.dev/);
});
