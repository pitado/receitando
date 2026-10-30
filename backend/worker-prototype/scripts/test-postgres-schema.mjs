// Real PostgreSQL smoke: schema, CRUD, FTS and D1 compatibility gateway.
// CI supplies POSTGRES_TEST_URL pointing only to an isolated temporary PostgreSQL.
import { readFile } from "node:fs/promises";
import { Client } from "pg";

if (!process.env.POSTGRES_TEST_URL) {
  throw new Error("POSTGRES_TEST_URL is required; never run these fixture tests against production");
}
const { PgCompatDatabase } = await import("../.test-dist/lib/postgres-adapter.js");
const databaseHost = new URL(process.env.POSTGRES_TEST_URL).hostname;
if (!["localhost", "127.0.0.1", "::1"].includes(databaseHost)) throw new Error("Fixtures are allowed only against localhost test PostgreSQL");
const client = new Client({ connectionString: process.env.POSTGRES_TEST_URL });
await client.connect();
try {
  const schema = await readFile(new URL("../migrations/postgres/0001_baseline.sql", import.meta.url), "utf8");
  await client.query(schema);
  const db = new PgCompatDatabase(client);

  const user = "fixture-user";
  const recipe = "fixture-recipe";
  const ingredient = "fixture-ingredient";
  await db.prepare("INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)").bind(user, "Teste", "fixture@local.invalid", "test").run();
  await db.prepare("INSERT INTO ingredients (id, name, normalized_name, category) VALUES (?, ?, ?, ?)").bind(ingredient, "Banana", "banana", "frutas").run();
  await db.prepare("INSERT INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, source_type, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(recipe, "Bolo de banana", "bolo-banana-test", "Receita teste com banana madura", "Misture e asse", 35, 4, "USER", "https://example.invalid/bolo-banana.jpg").run();

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

  // Route-level smoke with the REAL API stack and a fake D1 binding backed by PostgreSQL.
  const api = (await import("../.test-dist/app-router.js")).default;
  const env = { db, FRONTEND_URL: "https://receitando.example.test" };
  async function invoke(endpoint, method = "GET", body = undefined, sessionToken = "") {
    const headers = { Origin: "https://receitando.example.test" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (sessionToken) headers.Authorization = "Bearer " + sessionToken;
    return api.fetch(new Request("https://api.receitando.example.test" + endpoint, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }), env);
  }
  const health = await invoke("/api/health");
  if (health.status !== 200) throw new Error("Real API health route failed with PostgreSQL gateway");
  const credentials = { email: "regression-test@local.invalid", password: "uma-senha-longa-para-testes-2026" };
  const signup = await invoke("/api/auth/register", "POST", { name: "Teste Banco", ...credentials, remember: true });
  if (signup.status !== 201) throw new Error("Registration failed using PostgreSQL: " + signup.status + " " + await signup.text());
  const signupPayload = await signup.json();
  const sessionToken = signupPayload.token;
  if (!sessionToken) throw new Error("Registration did not issue a database-backed session");
  const profile = await invoke("/api/auth/me", "GET", undefined, sessionToken);
  if (profile.status !== 200) throw new Error("Session validation failed using PostgreSQL: " + profile.status);
  const login = await invoke("/api/auth/login", "POST", credentials);
  if (login.status !== 200) throw new Error("Login failed using PostgreSQL: " + login.status + " " + await login.text());
  const addPantry = await invoke("/api/pantry", "POST", { ingredientId: ingredient, quantity: 2, unit: "un" }, sessionToken);
  if (addPantry.status !== 200) throw new Error("Pantry write failed using PostgreSQL: " + addPantry.status + " " + await addPantry.text());
  const listPantry = await invoke("/api/pantry", "GET", undefined, sessionToken);
  const pantry = await listPantry.json();
  if (listPantry.status !== 200 || !Array.isArray(pantry) || pantry.length !== 1) throw new Error("Pantry read failed using PostgreSQL");
  const fav = await invoke("/api/favorites", "POST", { recipeId: recipe }, sessionToken);
  if (fav.status !== 200) throw new Error("Favorites write failed using PostgreSQL: " + fav.status + " " + await fav.text());
  const catalog = await invoke("/api/v2/recipes?q=banana");
  if (catalog.status !== 200) throw new Error("Catalog + search failed using PostgreSQL: " + catalog.status + " " + await catalog.text());
  const parsedCatalog = await catalog.json();
  if (!parsedCatalog.items?.some(item => item.id === recipe)) throw new Error("Catalog returned no seeded recipe via Postgres FTS");
  console.log("PostgreSQL real API routes passed: health, register, bearer auth, login, pantry, favorites and catalog FTS.");
  console.log("PostgreSQL: schema, real FTS, indexed lookup, parameter binding, conflict and transactional rollback passed.");
} finally {
  await client.end();
}
