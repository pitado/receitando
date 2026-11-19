const test = require("node:test");
const assert = require("node:assert/strict");
const pantryWorker = require("../.test-dist/pantry-worker.js").default;

function dbFor(userId) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      let params = [];
      const statement = {
        bind(...values) {
          params = values;
          return statement;
        },
        async first() {
          calls.push({ operation: "first", sql, params });
          if (sql.includes("FROM sessions s JOIN users u")) {
            return { id: userId, name: "Teste", email: "teste@example.com", role: "USER" };
          }
          return null;
        },
        async all() {
          calls.push({ operation: "all", sql, params });
          return {
            results: [{
              id: "item-1", ingredientId: "ingrediente-1",
              ingredientName: "Ovo", quantity: 2, unit: "un",
              expiresAt: null, createdAt: "2026-01-01",
              updatedAt: "2026-01-01", normalizedName: "ovo",
              category: "Proteínas",
            }],
          };
        },
        async run() {
          calls.push({ operation: "run", sql, params });
          return { success: true };
        },
      };
      return statement;
    },
  };
}

function env(db) {
  return { db, FRONTEND_URL: "https://app.example.test" };
}

test("GET da despensa exige autenticação", async () => {
  const db = dbFor("usuario-1");
  const response = await pantryWorker.fetch(
    new Request("https://api.example.test/api/pantry"),
    env(db),
  );
  assert.equal(response.status, 401);
  assert.equal(db.calls.length, 0);
});

test("GET da despensa filtra a consulta pelo usuário autenticado", async () => {
  const db = dbFor("usuario-1");
  const response = await pantryWorker.fetch(
    new Request("https://api.example.test/api/pantry", {
      headers: { Authorization: "Bearer token-teste" },
    }),
    env(db),
  );
  assert.equal(response.status, 200);
  const items = await response.json();
  assert.equal(items.length, 1);
  assert.equal(items[0].ingredientName, "Ovo");
  const listQuery = db.calls.find((call) =>
    call.operation === "all" && call.sql.includes("FROM pantry_items p"),
  );
  assert.ok(listQuery, "consulta da despensa não encontrada");
  assert.match(listQuery.sql, /WHERE p\.user_id = \?/);
  assert.deepEqual(listQuery.params, ["usuario-1"]);
});

test("GET retorna a lista atualizada em uma nova consulta", async () => {
  const db = dbFor("usuario-2");
  const request = () => new Request("https://api.example.test/api/pantry", {
    headers: { Authorization: "Bearer token-teste" },
  });
  const first = await pantryWorker.fetch(request(), env(db));
  const second = await pantryWorker.fetch(request(), env(db));
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(await second.json(), await first.json());
  assert.equal(db.calls.filter((call) => call.operation === "all").length, 2);
});
