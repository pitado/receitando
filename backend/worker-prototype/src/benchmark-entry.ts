import productionApi from "./session-cookie-worker";
import type { Env } from "./lib/worker-http";
// Deployable test Worker: same REST router and postgres-adapter as production, but
// only a benchmark table on an isolated Neon branch through its own Hyperdrive.
type BenchEnv = Env & { BENCHMARK_TOKEN?: string; BENCHMARK_ENABLED?: string };
export default {
  async fetch(request: Request, env: BenchEnv): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path !== "/api/internal/load-benchmark" && path !== "/api/health")
      return new Response("Not found", { status: 404 });
    if (!env.BENCHMARK_TOKEN || request.headers.get("X-Benchmark-Token") !== env.BENCHMARK_TOKEN)
      return new Response("Unauthorized", { status: 401 });
    if (env.BENCHMARK_ENABLED !== "true" || !env.HYPERDRIVE?.connectionString)
      return new Response("Unavailable", { status: 503 });
    return productionApi.fetch(request, env);
  },
};
