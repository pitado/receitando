import { Client, types } from "pg";
import type { Env } from "./worker-http";

// Backend PostgreSQL via Hyperdrive, com adaptação para consultas parametrizadas dos módulos existentes.
types.setTypeParser(20, (value: string) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : value;
});

type Params = unknown[];

/** Normalize SQL positional parameters, conflict syntax and full-text predicates for PostgreSQL. */
export function convertSql(sql: string, values: Params): { text: string; values: Params } {
  let query = sql
    .replace(/\bINSERT\s+OR\s+IGNORE\s+INTO\b/gi, "INSERT INTO")
    .replace(/\bCOLLATE\s+NOCASE\b/gi, 'COLLATE "default"')
    // PostgreSQL folds unquoted camelCase aliases to lowercase; SQLite preserves them.
    .replace(/\bAS\s+([A-Za-z_][A-Za-z0-9_]*)\b/gi, (match, alias: string) =>
      /[A-Z]/.test(alias) ? 'AS "' + alias + '"' : match)
    .replace(/\brecipe_search\s+MATCH\s+\?/gi, "recipe_search.search_vector @@ to_tsquery('portuguese', ?)")
    .replace(/\bbm25\s*\(\s*recipe_search\s*\)/gi, "(-EXTRACT(EPOCH FROM r.updated_at::timestamptz))");

  if (/\bINSERT\s+OR\s+IGNORE\s+INTO\b/i.test(sql)) {
    query = query.trim().replace(/;$/, "") + " ON CONFLICT DO NOTHING";
  }

  if (/\brecipe_search\s+MATCH\s+\?/i.test(sql)) {
    values = values.map((value) => {
      if (typeof value !== "string" || !/^"[a-z0-9]+"\*(?: AND "[a-z0-9]+"\*)*$/i.test(value)) {
        return value;
      }
      return value.split(" AND ").map((term) => term.slice(1, -2) + ":*").join(" & ");
    });
  }

  let text = "";
  let quote: "'" | '"' | null = null;
  let lineComment = false;
  let blockComment = false;
  let position = 0;
  for (let i = 0; i < query.length; i += 1) {
    const ch = query[i];
    const next = query[i + 1];
    if (lineComment) { text += ch; if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { text += ch; if (ch === "*" && next === "/") { text += "/"; i += 1; blockComment = false; } continue; }
    if (!quote && ch === "-" && next === "-") { text += "--"; i += 1; lineComment = true; continue; }
    if (!quote && ch === "/" && next === "*") { text += "/*"; i += 1; blockComment = true; continue; }
    if (quote) {
      text += ch;
      if (ch === quote) {
        if (next === quote) { text += next; i += 1; } else quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') { quote = ch; text += ch; continue; }
    if (ch === "?") { position += 1; text += "$" + position; continue; }
    text += ch;
  }
  if (position !== values.length) throw new Error("SQL bind mismatch: expected " + position + ", got " + values.length);
  return { text, values };
}

class PgStatement {
  private values: Params = [];
  constructor(private readonly client: Client, private readonly sql: string) {}
  bind(...values: Params): PgStatement { this.values = values; return this; }
  private async execute() {
    const converted = convertSql(this.sql, this.values);
    return this.client.query(converted.text, converted.values);
  }
  async first<T>(): Promise<T | null> { const rows = (await this.execute()).rows; return (rows[0] as T) ?? null; }
  async all<T>(): Promise<{ results: T[]; success: boolean; meta: Record<string, never> }> {
    const rows = (await this.execute()).rows as T[];
    return { results: rows, success: true, meta: {} };
  }
  async run() {
    const result = await this.execute();
    return { success: true, meta: { changes: result.rowCount ?? 0 } };
  }
}

export class PgCompatDatabase {
  constructor(private readonly client: Client) {}
  prepare(sql: string) { return new PgStatement(this.client, sql); }
  async batch(statements: PgStatement[]) {
    await this.client.query("BEGIN");
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      await this.client.query("COMMIT");
      return results;
    } catch (error) {
      await this.client.query("ROLLBACK");
      throw error;
    }
  }
  async exec(sql: string) {
    await this.client.query(sql);
    return { count: 1, duration: 0 };
  }
}

/** One connection per HTTP request. Hyperdrive handles pooling to PostgreSQL. */
export async function withSelectedDatabase<T>(env: Env, operation: (selectedEnv: Env) => Promise<T>): Promise<T> {
  // API always uses PostgreSQL; do not silently bypass the connection configuration.
  if (!env.HYPERDRIVE?.connectionString) {
    throw new Error("DATABASE_ENGINE=postgres requires a configured HYPERDRIVE binding");
  }
  const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
  await client.connect();
  try {
    return await operation({ ...env, db: new PgCompatDatabase(client) as unknown as D1Database });
  } finally {
    await client.end();
  }
}
