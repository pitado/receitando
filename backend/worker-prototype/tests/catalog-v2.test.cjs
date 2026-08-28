const test = require("node:test");
const assert = require("node:assert/strict");

const catalogV2Worker = require("../.test-dist/catalog-v2-worker.js").default;

function normalizeSql(sql) {
  return sql.replace(/\s+/g, " ").trim();
}

function createDb(handler) {
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

function request(query = "") {
  return new Request(`https://api.example.test/api/v2/recipes${query}`);
}

const recipe = {
  id: "recipe-1",
  title: "Bolo simples",
  slug: "bolo-simples",
  description: "Bolo para o café",
  prepMinutes: 30,
  servings: 8,
  mealType: "Sobremesa",
  difficulty: "FACIL",
  imageUrl: "https://example.test/bolo.jpg",
  sourceName: "Wikilivros",
  externalSource: "wikibooks",
};

test("catálogo v2 retorna item leve, total real e hasMore", async () => {
  const db = createDb(async ({ op, sql }) => {
    if (op === "first" && sql.startsWith("SELECT COUNT(*) AS total")) return { total: 2 };
    if (op === "all" && sql.includes("r.source_name AS sourceName")) return [recipe];
    if (op === "all" && sql.includes("FROM recipe_tags")) {
      return [{ recipeId: "recipe-1", tag: "bolo" }];
    }
    return undefined;
  });

  const response = await catalogV2Worker.fetch(request("?limit=1&offset=0"), env(db));
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.pagination.total, 2);
  assert.equal(payload.pagination.limit, 1);
  assert.equal(payload.pagination.offset, 0);
  assert.equal(payload.pagination.hasMore, true);
  assert.equal(payload.items.length, 1);
  assert.deepEqual(payload.items[0].tags, ["bolo"]);
  assert.deepEqual(payload.items[0].source, {
    name: "Wikilivros",
    externalSource: "wikibooks",
  });
  assert.equal("instructions" in payload.items[0], false);
  assert.equal("ingredients" in payload.items[0], false);
});

test("catálogo v2 aplica busca, filtros e ordenação popular", async () => {
  const db = createDb(async ({ op, sql }) => {
    if (op === "first" && sql.startsWith("SELECT COUNT(*) AS total")) return { total: 1 };
    if (op === "all" && sql.includes("r.source_name AS sourceName")) return [recipe];
    if (op === "all" && sql.includes("FROM recipe_tags")) return [];
    return undefined;
  });

  const response = await catalogV2Worker.fetch(
    request("?q=bolo&source=wikibooks&mealType=Sobremesa&difficulty=FACIL&maxPrepMinutes=30&sort=popular"),
    env(db),
  );
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.pagination.total, 1);
  assert.equal(payload.filters.query, "bolo");
  assert.equal(payload.filters.source, "wikibooks");
  assert.equal(payload.filters.mealType, "Sobremesa");
  assert.equal(payload.filters.difficulty, "FACIL");
  assert.equal(payload.filters.maxPrepMinutes, 30);
  assert.equal(payload.filters.sort, "popular");

  const countCall = db.calls.find((call) => call.op === "first" && call.sql.startsWith("SELECT COUNT(*) AS total"));
  assert.ok(countCall);
  assert.match(countCall.sql, /JOIN recipe_search/);
  assert.match(countCall.sql, /recipe_search MATCH \?/);
  assert.match(countCall.sql, /lower\(r\.external_source\) = \?/);
  assert.match(countCall.sql, /lower\(r\.meal_type\) = lower\(\?\)/);
  assert.match(countCall.sql, /r\.difficulty = \?/);
  assert.match(countCall.sql, /r\.prep_minutes > 0 AND r\.prep_minutes <= \?/);
  assert.deepEqual(countCall.args, ['"bolo"*', "wikibooks", "Sobremesa", "FACIL", 30]);

  const listCall = db.calls.find((call) => call.op === "all" && call.sql.includes("r.source_name AS sourceName"));
  assert.ok(listCall);
  assert.match(listCall.sql, /recipe_votes/);
  assert.match(listCall.sql, /favorites/);
  assert.match(listCall.sql, /recipe_comments/);
});
