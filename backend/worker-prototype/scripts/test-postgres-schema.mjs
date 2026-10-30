// Real PostgreSQL smoke: schema, CRUD, FTS and D1 compatibility gateway.
// CI supplies POSTGRES_TEST_URL pointing only to an isolated temporary PostgreSQL.
import { readFile } from "node:fs/promises";
import { Client } from "pg";

if (!process.env.POSTGRES_TEST_URL) {
  throw new Error("POSTGRES_TEST_URL is required; never run these fixture tests against production");
}
const { PgCompatDatabase } = await import("../.test-dist/lib/postgres-adapter.js");
const client = new Client({ connectionString: process.env.POSTGRES_TEST_URL });
await client.connect();
let began = false;
try {
  const schema = await readFile(new URL("../migrations/postgres/0001_baseline.sql", import.meta.url), "utf8");
  await client.query(schema);
  const db = new PgCompatDatabase(client);
  await client.query("BEGIN");
  began = true;

  const user = "fixture-user";
  const recipe = "fixture-recipe";
  const ingredient = "fixture-ingredient";
  await db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").bind(user, "Teste", "fixture@local.invalid", "test").run();
  await db.prepare("INSERT INTO ingredients (id, name, normalized_name, category) VALUES (?, ?, ?, ?)").bind(ingredient, "Banana", "banana", "frutas").run();
  await db.prepare("INSERT INTO recipes (id, title, slug, description, instructions, prep_minutes, servings) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(recipe, "Bolo de banana", "bolo-banana-test", "Receita teste com banana madura", "Misture e asse", 35, 4).run();

  const search = await db.prepare("SELECT r.id FROM recipe_search JOIN recipes r ON recipe_search.recipe_id = r.id WHERE recipe_search MATCH ? ORDER BY bm25(recipe_search), r.title")
    .bind('"banana"*').all();
  if (search.results.length !== 1 || search.results[0].id !== recipe) {
    throw new Error("PostgreSQL FTS compatibility query did not return fixture recipe");
  }
  await db.prepare("INSERT OR IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)").bind(user, recipe).run();
  await db.prepare("INSERT OR IGNORE INTO favorites (user_id, recipe_id) VALUES (?, ?)").bind(user, recipe).run();
  const count = await db.prepare("SELECT COUNT(*) AS total FROM favorites WHERE user_id = ?").bind(user).first();
  if (Number(count?.total) !== 1) throw new Error("ON CONFLICT DO NOTHING did not prevent duplicate favorites");

  try {
    await db.batch([
      db.prepare("INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)").bind(recipe, "antes-rollback"),
      db.prepare("INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)").bind("nonexistent-recipe-id", "falha-intencional"),
    ]);
    throw new Error("Expected transaction rollback on invalid foreign key");
  } catch (error) {
    // Failed batch should be rolled back and outer test transaction unaffected.
    if (String(error).includes("Expected transaction rollback")) throw error;
  }
  const tags = await db.prepare("SELECT COUNT(*) AS total FROM recipe_tags WHERE recipe_id = ?").bind(recipe).first();
  if (Number(tags?.total) !== 0) throw new Error("Failed batch wrote partially");

  const dateRow = await db.prepare("SELECT created_at FROM users WHERE id = ?").bind(user).first();
  if (!/^\d{4}-\d{2}-\d{2}T/.test(dateRow?.created_at ?? "")) {
    throw new Error("Timestamp default lost ISO format compatibility");
  }
  await client.query("ROLLBACK");
  began = false;
  console.log("PostgreSQL: schema, real FTS, indexed lookup, parameter binding, conflict and transactional rollback passed.");
} finally {
  if (began) await client.query("ROLLBACK").catch(() => {});
  await client.end();
}
