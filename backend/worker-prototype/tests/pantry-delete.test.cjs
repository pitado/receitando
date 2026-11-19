// Testes do DELETE /api/pantry/:id (Fase 5, issue 1332).
//
// Usam um banco SQLite REAL em memória (node:sqlite), isolado e descartável, com as
// tabelas relevantes do schema. Nenhum banco Neon/produção é tocado. O worker é o
// código real compilado; só a camada D1-like (prepare/bind/first/all/run) é um adaptador.
const test = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");

const pantryWorker = require("../.test-dist/pantry-worker.js").default;
const { sha256 } = require("../.test-dist/lib/security.js");

const TOKEN_A = "token-usuaria-a";
const TOKEN_B = "token-usuario-b";

function createSqliteD1() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'USER');
    CREATE TABLE sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TEXT NOT NULL);
    CREATE TABLE ingredients (id TEXT PRIMARY KEY, name TEXT NOT NULL, normalized_name TEXT NOT NULL UNIQUE, category TEXT NOT NULL);
    CREATE TABLE pantry_items (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, ingredient_id TEXT NOT NULL,
      quantity REAL, unit TEXT, expires_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE (user_id, ingredient_id)
    );
  `);

  return {
    sqlite,
    prepare(sql) {
      let args = [];
      const statement = {
        bind(...values) {
          args = values;
          return statement;
        },
        async first() {
          return sqlite.prepare(sql).get(...args) ?? null;
        },
        async all() {
          return { results: sqlite.prepare(sql).all(...args) };
        },
        async run() {
          const info = sqlite.prepare(sql).run(...args);
          return { success: true, meta: { changes: Number(info.changes) } };
        },
      };
      return statement;
    },
  };
}

async function seed(db) {
  const future = new Date(Date.now() + 86_400_000).toISOString();
  const now = "2026-11-19T12:00:00.000Z";
  const { sqlite } = db;

  sqlite.exec(`
    INSERT INTO users (id, name, email) VALUES ('user-a', 'Ana', 'ana@example.test'), ('user-b', 'Bruno', 'bruno@example.test');
    INSERT INTO ingredients (id, name, normalized_name, category) VALUES
      ('ing-ovo', 'Ovo', 'ovo', 'Proteínas'), ('ing-leite', 'Leite', 'leite', 'Laticínios');
    INSERT INTO pantry_items (id, user_id, ingredient_id, quantity, unit, created_at, updated_at) VALUES
      ('item-a-ovo', 'user-a', 'ing-ovo', 2, 'un', '${now}', '${now}'),
      ('item-a-leite', 'user-a', 'ing-leite', 1, 'l', '${now}', '${now}'),
      ('item-b-ovo', 'user-b', 'ing-ovo', 6, 'un', '${now}', '${now}');
  `);

  const insertSession = sqlite.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)");
  insertSession.run("s-a", "user-a", await sha256(TOKEN_A), future);
  insertSession.run("s-b", "user-b", await sha256(TOKEN_B), future);
}

async function setup() {
  const db = createSqliteD1();
  await seed(db);
  const env = { db, FRONTEND_URL: "https://app.example.test", RESEND_API_KEY: "", EMAIL_FROM: "" };
  return { db, env };
}

function del(path, env, token = TOKEN_A) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  return pantryWorker.fetch(new Request(`https://api.example.test${path}`, { method: "DELETE", headers }), env);
}

function idsOf(db, userId) {
  return db.sqlite
    .prepare("SELECT id FROM pantry_items WHERE user_id = ? ORDER BY id")
    .all(userId)
    .map((row) => row.id);
}

test("DELETE remove o item do banco e devolve a lista atualizada", async () => {
  const { db, env } = await setup();

  const response = await del("/api/pantry/item-a-ovo", env);
  assert.equal(response.status, 200);

  const list = await response.json();
  assert.deepEqual(list.map((item) => item.id), ["item-a-leite"]);
  assert.deepEqual(idsOf(db, "user-a"), ["item-a-leite"]);

  // "Atualizar a página": nova leitura independente continua sem o item.
  const reload = await pantryWorker.fetch(
    new Request("https://api.example.test/api/pantry", { headers: { Authorization: `Bearer ${TOKEN_A}` } }),
    env,
  );
  assert.deepEqual((await reload.json()).map((item) => item.id), ["item-a-leite"]);
});

test("DELETE repetido do mesmo item retorna 404 sem afetar outros itens", async () => {
  const { db, env } = await setup();

  assert.equal((await del("/api/pantry/item-a-ovo", env)).status, 200);
  const again = await del("/api/pantry/item-a-ovo", env);

  assert.equal(again.status, 404);
  assert.match((await again.json()).message, /não encontrado/i);
  assert.deepEqual(idsOf(db, "user-a"), ["item-a-leite"]);
});

test("DELETE de item inexistente retorna 404 e não altera nada", async () => {
  const { db, env } = await setup();

  const response = await del("/api/pantry/nao-existe", env);

  assert.equal(response.status, 404);
  assert.deepEqual(idsOf(db, "user-a"), ["item-a-leite", "item-a-ovo"]);
  assert.deepEqual(idsOf(db, "user-b"), ["item-b-ovo"]);
});

test("DELETE sem sessão ou com token inválido retorna 401 e preserva o banco", async () => {
  const { db, env } = await setup();

  assert.equal((await del("/api/pantry/item-a-ovo", env, null)).status, 401);
  assert.equal((await del("/api/pantry/item-a-ovo", env, "token-invalido")).status, 401);

  assert.deepEqual(idsOf(db, "user-a"), ["item-a-leite", "item-a-ovo"]);
});

test("isolamento: usuário B não consegue excluir item da conta A (404 idêntico ao inexistente)", async () => {
  const { db, env } = await setup();

  const foreign = await del("/api/pantry/item-a-ovo", env, TOKEN_B);
  const missing = await del("/api/pantry/nao-existe", env, TOKEN_B);

  assert.equal(foreign.status, 404);
  assert.deepEqual(await foreign.json(), await missing.json());
  assert.deepEqual(idsOf(db, "user-a"), ["item-a-leite", "item-a-ovo"]);
  assert.deepEqual(idsOf(db, "user-b"), ["item-b-ovo"]);
});

test("DELETE exclui apenas o item pedido quando outra conta tem o mesmo ingrediente", async () => {
  const { db, env } = await setup();

  assert.equal((await del("/api/pantry/item-b-ovo", env, TOKEN_B)).status, 200);

  assert.deepEqual(idsOf(db, "user-b"), []);
  assert.deepEqual(idsOf(db, "user-a"), ["item-a-leite", "item-a-ovo"]);
});

test("DELETE rejeita IDs inválidos com 400 sem consultar itens", async () => {
  const { db, env } = await setup();

  for (const path of [
    "/api/pantry/%E0%A4%A", // percent-encoding malformado (antes gerava erro 500)
    "/api/pantry/a%2Fb",
    "/api/pantry/a/b",
    "/api/pantry/%00",
    "/api/pantry/%20",
    `/api/pantry/${"x".repeat(101)}`,
  ]) {
    const response = await del(path, env);
    assert.equal(response.status, 400, path);
  }

  assert.deepEqual(idsOf(db, "user-a"), ["item-a-leite", "item-a-ovo"]);
});

test("DELETE com ID de injeção SQL é tratado como dado e não apaga nada", async () => {
  const { db, env } = await setup();

  const response = await del(`/api/pantry/${encodeURIComponent("x' OR '1'='1")}`, env);

  assert.equal(response.status, 404);
  assert.deepEqual(idsOf(db, "user-a"), ["item-a-leite", "item-a-ovo"]);
  assert.deepEqual(idsOf(db, "user-b"), ["item-b-ovo"]);
});
