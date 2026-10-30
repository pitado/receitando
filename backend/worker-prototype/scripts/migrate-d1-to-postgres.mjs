// Selective Receitando D1 -> Neon migration. Original D1 remains untouched.
// Do not import old recipes, relations that depend on them, or SQLite FTS virtual tables.
// Execute only when writes to D1 have been frozen and an external D1 backup/bookmark exists.
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Client } from "pg";

const tables = [
  "users",
  "ingredients",
  "ingredient_aliases",
  "sessions",
  "pantry_items",
  "password_reset_codes",
  "auth_rate_limit_events",
  "load_benchmark",
  "recipe_submissions",
];
const omitted = [
  "recipes", "recipe_ingredients", "recipe_tags",
  "favorites", "recipe_votes", "recipe_comments",
];
const {
  DATABASE_URL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID,
  CONFIRM_D1_FREEZE, D1_BACKUP_BOOKMARK, MIGRATION_SCOPE,
} = process.env;

if (MIGRATION_SCOPE !== "no-old-recipes") {
  throw new Error("MIGRATION_SCOPE=no-old-recipes is required to prevent accidental full-catalog migration");
}
if (![DATABASE_URL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, D1_DATABASE_ID].every(Boolean)) {
  throw new Error("DATABASE_URL, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and D1_DATABASE_ID are required");
}
if (CONFIRM_D1_FREEZE !== "yes" || !D1_BACKUP_BOOKMARK) {
  throw new Error("Freeze D1 writes, retain its backup and set CONFIRM_D1_FREEZE=yes with D1_BACKUP_BOOKMARK");
}

const endpoint = "https://api.cloudflare.com/client/v4/accounts/" + CLOUDFLARE_ACCOUNT_ID +
  "/d1/database/" + D1_DATABASE_ID;
async function cfRequest(route, options = {}) {
  const response = await fetch(endpoint + route, {
    ...options,
    headers: {
      Authorization: "Bearer " + CLOUDFLARE_API_TOKEN,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error("Cloudflare D1 request returned HTTP " + response.status);
  const json = await response.json();
  if (!json.success) throw new Error("Cloudflare D1 request failed");
  return json.result;
}

async function d1Bookmark() {
  const result = await cfRequest("/time_travel/bookmark");
  if (!result?.bookmark) throw new Error("Could not verify D1 Time Travel bookmark");
  return result.bookmark;
}

async function d1Query(sql, params = []) {
  const result = await cfRequest("/query", {
    method: "POST",
    body: JSON.stringify({ sql, params }),
  });
  if (!result?.[0]?.success || !Array.isArray(result[0].results)) {
    throw new Error("Cloudflare D1 query failed");
  }
  return result[0].results;
}

const startingBookmark = await d1Bookmark();
if (startingBookmark !== D1_BACKUP_BOOKMARK) {
  throw new Error("D1 changed after the supplied backup bookmark. Freeze writes, make a fresh backup and retry");
}

const pg = new Client({ connectionString: DATABASE_URL, connectionTimeoutMillis: 15000 });
await pg.connect();
let inTransaction = false;
try {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const schema = await readFile(path.resolve(here, "../migrations/postgres/0001_baseline.sql"), "utf8");
  // The schema is versioned in Git and is applied before the import transaction.
  await pg.query(schema);
  await pg.query("BEGIN");
  inTransaction = true;
  const counts = {};

  for (const table of tables) {
    const sourceCountRows = await d1Query('SELECT COUNT(*) AS n FROM "' + table + '"');
    const sourceCount = Number(sourceCountRows[0]?.n);
    if (!Number.isSafeInteger(sourceCount)) throw new Error("Invalid source count for " + table);
    let transferred = 0;

    for (let offset = 0; offset < sourceCount; offset += 100) {
      const rows = await d1Query('SELECT * FROM "' + table + '" ORDER BY rowid LIMIT 100 OFFSET ?', [offset]);
      if (rows.length !== Math.min(100, sourceCount - offset)) {
        throw new Error("D1 pagination changed during migration for " + table);
      }
      const columns = Object.keys(rows[0]);
      const columnSql = columns.map(col => '"' + col.replaceAll('"', '""') + '"').join(",");
      const values = [];
      const groups = rows.map(row => {
        const parameters = columns.map(col => {
          values.push(row[col]);
          return "$" + values.length;
        });
        return "(" + parameters.join(",") + ")";
      });
      // Idempotent import: existing rows are updated with the latest source values,
      // while unrelated newly created Neon records are left untouched.
      const updates = columns.filter(col => col !== "id")
        .map(col => '"' + col + '"=EXCLUDED."' + col + '"').join(",");
      const sql = 'INSERT INTO "' + table + '" (' + columnSql + ') VALUES ' +
        groups.join(",") + " ON CONFLICT (id) DO UPDATE SET " + updates;
      await pg.query(sql, values);
      transferred += rows.length;
    }

    const destinationRows = await pg.query('SELECT COUNT(*) AS n FROM "' + table + '"');
    const destinationCount = Number(destinationRows.rows[0].n);
    if (transferred !== sourceCount || destinationCount !== sourceCount) {
      throw new Error(table + " count mismatch: source=" + sourceCount +
        ", transferred=" + transferred + ", destination=" + destinationCount);
    }
    counts[table] = sourceCount;
  }

  if (await d1Bookmark() !== startingBookmark) {
    throw new Error("D1 bookmark changed during import: rollback; synchronize against a frozen snapshot");
  }
  await pg.query("COMMIT");
  inTransaction = false;
  console.log(JSON.stringify({
    success: true,
    scope: "no-old-recipes",
    transferredCounts: counts,
    skippedRecipeDependentTables: omitted,
    note: "D1 kept intact; never enable DATABASE_ENGINE=postgres before staging verification",
  }));
} catch (error) {
  if (inTransaction) await pg.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await pg.end();
}
