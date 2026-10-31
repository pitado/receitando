// Production-safe probe: bounded GET requests only, no authentication or mutations.
import { mkdir, writeFile } from "node:fs/promises";

const base = "https://api.receitando.miguelpita.com.br";
const paths = ["/api/health", "/api/v2/recipes?limit=5"];
const rounds = 25;
const samples = [];
const startedAt = new Date().toISOString();
const start = performance.now();
for (let n = 0; n < rounds; n += 1) {
  for (const path of paths) {
    const begin = performance.now();
    let status = null, error = null;
    try {
      const response = await fetch(base + path, {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "Receitando-Fase4-ReadProbe/1.0", Accept: "application/json" },
      });
      status = response.status;
      await response.arrayBuffer();
    } catch (cause) { error = String(cause); }
    samples.push({ path, status, ms: Math.round((performance.now() - begin) * 100) / 100, error });
  }
  await new Promise(resolve => setTimeout(resolve, 150));
}
const durations = samples.map(v => v.ms).sort((a,b) => a-b);
const percentile = p => durations[Math.min(durations.length - 1, Math.ceil((p / 100) * durations.length) - 1)] ?? null;
const success = samples.filter(x => x.status === 200).length;
const result = {
  target: "production API — HTTPS read-only",
  startedAt,
  endedAt: new Date().toISOString(),
  requests: samples.length,
  success,
  failures: samples.length - success,
  failureRate: (samples.length - success) / samples.length,
  p50ms: percentile(50),
  p95ms: percentile(95),
  p99ms: percentile(99),
  meanRps: Math.round(samples.length / ((performance.now() - start) / 1000) * 100) / 100,
  sampleErrors: samples.filter(x => x.status !== 200).slice(0, 10),
  methodology: "50 sequential GETs with 150ms pause between two-URL rounds; not a concurrency/load capacity test. No writes, no credentials.",
};
await mkdir("results/load", {recursive:true});
await writeFile("results/load/production-http-read-probe.json", JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result,null,2));
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    "### Teste HTTP de produção (somente GET)\n"+
    "- **Sucesso:** "+success+"/"+samples.length+"; **p95:** "+result.p95ms+" ms; **RPS médio:** "+result.meanRps+"\n"+
    "- **Escopo:** tráfego sequencial leve; não valida escrita nem capacidade concorrente.\n");
}
if (success !== samples.length) process.exitCode = 1;
