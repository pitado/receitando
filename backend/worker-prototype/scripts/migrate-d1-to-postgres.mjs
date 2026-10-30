// One-time D1 export to PostgreSQL; records are never logged.
// The operator must freeze writes to D1 and retain a Cloudflare backup/bookmark.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Client } from "pg";

const tables = [
  "users", "ingredients", "recipes", "sessions", "ingredient_aliases",
  "recipe_ingredients", "pantry_items", "favorites", "recipe_tags",
  "recipe_votes", "recipe_comments", "password_reset_codes",
  "recipe_submissions", "auth_rate_limit_events", "load_benchmark",
];
const { DATABASE_URL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID, CONFIRM_D1_FREEZE } = process.env;
if (![DATABASE_URL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID].every(Boolean)) {
  throw new Error("DATABASE_URL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and D1_DATABASE_ID are required");
}
if (CONFIRM_D1_FREEZE !== "yes") {
  throw new Error("Stop all writes to D1, take a backup, then pass CONFIRM_D1_FREEZE=yes");
}

async function d1Query(sql, params = []) {
  const endpoint = "https://api.cloudflare.com/client/v4/accounts/" + CLOUDFLARE_ACCOUNT_ID + "/d1/database/" + D1_DATABASE_ID + "/query";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: "Bearer " + CLOUDFLARE_API_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params }),
  });
  if (!response.ok) throw new Error("Cloudflare API HTTP " + response.status);
  const json = await response.json();
  if (!json.success || !json.result?.[0]?.success) throw new Error("Cloudflare D1 query failed");
  return json.result[0].results;
}

const pg = new Client({ connectionString: DATABASE_URL });
await pg.connect();
const here = path.dirname(fileURLToPath(import.meta.url));
try {
  const schema = await readFile(path.resolve(here, "../migrations/postgres/0001_baseline.sql"), "utf8");
  await pg.query(schema);
  await pg.query("BEGIN");
  const counts = {};
  for (const table of tables) {
    let offset = 0;
    let total = 0;
    while (true) {
      // Read-only, bounded pagination; production must be frozen for a consistent snapshot.
      const rows = await d1Query('SELECT * FROM "' + table + '" LIMIT 100 OFFSET ?', [offset]);
      if (!rows.length) break;
      const names = Object.keys(rows[0]);
      const columns = names.map((name) => '"' + name.replaceAll('"', '""') + '"').join(",");
      for (const row of rows) {
        const params = names.map((name) => row[name]);
        const placeholders = params.map((_, i) => "$" + (i + 1)).join(",");
        await pg.query('INSERT INTO "' + table + '" (' + columns + ') VALUES (' + placeholders + ') ON CONFLICT DO NOTHING', params);
      }
      offset += rows.length;
      total += rows.length;
    }
    const pgResult = await pg.query('SELECT COUNT(*) AS total FROM "' + table + '"');
    const pgCount = Number(pgResult.rows[0].total);
    if (pgCount !== total) throw new Error("Count mismatch for " + table + ": D1=" + total + ", PostgreSQL=" + pgCount);
    counts[table] = total;
  }
  await pg.query("COMMIT");
  console.log("Migration transferred and verified row counts:", counts);
  console.log("Perform staging read/write tests and semantic row audits before enabling DATABASE_ENGINE=postgres.");
} catch (error) {
  await pg.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await pg.end();
}
