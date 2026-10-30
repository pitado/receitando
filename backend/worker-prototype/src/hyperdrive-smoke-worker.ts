import { Client } from "pg";

// Isolated one-shot read-only check: this Worker is NOT the production API.
// The associated CI workflow deletes the Worker immediately after verification.
interface SmokeEnv {
  HYPERDRIVE: { connectionString: string };
}

export default {
  async fetch(request: Request, env: SmokeEnv): Promise<Response> {
    if (request.method !== "GET" || new URL(request.url).pathname !== "/verify") {
      return new Response("Not found", { status: 404 });
    }

    const client = new Client({
      connectionString: env.HYPERDRIVE.connectionString,
      connectionTimeoutMillis: 10000,
      query_timeout: 10000,
    });
    try {
      await client.connect();
      const { rows } = await client.query(
        "SELECT 1::integer AS ok, current_database() AS database_name, " +
        "current_setting('server_version') AS postgres_version, " +
        "(SELECT COUNT(*)::integer FROM pg_tables WHERE schemaname = 'public') AS app_tables"
      );
      const result = rows[0];
      return Response.json({
        success: result.ok === 1 && result.database_name === "receitando" && result.app_tables === 15,
        transport: "cloudflare-worker-hyperdrive",
        database_name: result.database_name,
        postgres_version: result.postgres_version,
        app_tables: result.app_tables,
      }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      // Do not expose connection strings, hostnames, passwords or credentials.
      console.error("Hyperdrive test failed:", error instanceof Error ? error.name : "unknown");
      return Response.json({ success: false, error: "database_connection_failed" }, { status: 503 });
    } finally {
      await client.end().catch(() => {});
    }
  },
};
