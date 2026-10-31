import fs from 'node:fs';

const base = (process.env.BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const targetWrites = Number(process.env.TARGET_WRITES || 1000000);
const targetReads = Number(process.env.TARGET_READS || 2000000);
const baseline = Number(process.env.BENCHMARK_BASELINE);
const k6Exit = Number(process.env.K6_EXIT_CODE);
const runUrl = process.env.GITHUB_RUN_ID
  ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : 'GitHub Actions (local)';

let summary = null;
let countAfter = null;
const problems = [];

try {
  summary = JSON.parse(fs.readFileSync('results/load/summary.json', 'utf8'));
} catch (error) { problems.push(`k6 summary ausente/inválido: ${error.message}`); }

try {
  const response = await fetch(base + '/api/internal/load-benchmark', { signal: AbortSignal.timeout(60000), headers: process.env.BENCHMARK_TOKEN ? { 'X-Benchmark-Token': process.env.BENCHMARK_TOKEN } : {} });
  const data = await response.json();
  if (!response.ok || data.ok !== true || !Number.isSafeInteger(data.total)) throw Error('Resposta final de contagem inválida.');
  countAfter = data.total;
} catch (error) { problems.push(`Contagem final do PostgreSQL indisponível: ${error.message}`); }

const metrics = summary?.metrics || {};
const metric = (name, field) => {
  const item = metrics[name];
  return item?.values?.[field] ?? item?.[field] ?? (field === 'rate' ? item?.value : null) ?? null;
};
const successfulWrites = metric('successful_writes', 'count');
const successfulReads = metric('successful_reads', 'count');
const failures = metric('http_req_failed', 'rate');
const p95 = metric('http_req_duration', 'p(95)');
const averageRps = metric('http_reqs', 'rate');
const retries = metric('benchmark_retries', 'count');
const deltaWrites = countAfter === null || !Number.isSafeInteger(baseline) ? null : countAfter - baseline;

if (k6Exit !== 0) problems.push(`k6 terminou com código ${k6Exit}`);
if (successfulWrites !== targetWrites) problems.push(`Escritas HTTP confirmadas: ${successfulWrites} / ${targetWrites}`);
if (successfulReads !== targetReads) problems.push(`Leituras HTTP confirmadas: ${successfulReads} / ${targetReads}`);
if (deltaWrites !== targetWrites) problems.push(`Diferença de linhas persistidas no PostgreSQL: ${deltaWrites} / ${targetWrites}`);
if (failures === null || failures >= 0.01) problems.push(`Taxa de falhas HTTP: ${failures}`);
if (p95 === null || p95 >= 1000) problems.push(`Latência p95: ${p95}`);

const approved = problems.length === 0;
const evidence = {
  scenario: process.env.SCENARIO,
  status: approved ? 'APROVADO' : 'NÃO APROVADO',
  environment: 'Cloudflare Worker remoto real + Hyperdrive exclusivo + Neon PostgreSQL isolado',
  run_url: runUrl,
  targets: { writes: targetWrites, reads: targetReads },
  actual: {
    successful_writes: successfulWrites, successful_reads: successfulReads,
    baseline_rows: baseline, final_rows: countAfter, persisted_delta: deltaWrites,
    http_failure_rate: failures, http_p95_ms: p95, avg_http_requests_per_second: averageRps,
    retries,
  },
  k6_exit_code: k6Exit,
  problems,
  caveat: 'Worker remoto Cloudflare com banco Neon isolado; não representa usuários/volume da produção principal.',
};
const report = [
  '# Evidência do benchmark Receitando — ' + evidence.status,
  '',
  `- **Ambiente:** ${evidence.environment}`,
  `- **Execução:** ${runUrl}`,
  `- **Escritas HTTP bem-sucedidas:** ${successfulWrites ?? 'indisponível'} / ${targetWrites}`,
  `- **Leituras HTTP com SELECT PostgreSQL bem-sucedidas:** ${successfulReads ?? 'indisponível'} / ${targetReads}`,
  `- **Linhas efetivamente persistidas (delta PostgreSQL):** ${deltaWrites ?? 'indisponível'} / ${targetWrites}`,
  `- **Taxa de erros HTTP:** ${failures === null ? 'indisponível' : (failures * 100).toFixed(4) + '%'}`,
  `- **Latência p95:** ${p95 ?? 'indisponível'} ms`,
  `- **Vazão média HTTP:** ${averageRps ?? 'indisponível'} req/s`,
  `- **Retentativas:** ${retries ?? 0}`,
  '',
  ...(problems.length ? ['## Motivos de não aprovação', ...problems.map(p => '- ' + p), ''] : []),
  '> Limitação: este cenário mede HTTP num Worker real da Cloudflare com Hyperdrive e PostgreSQL isolado, usando tabela sintética; não constitui prova de 3 milhões de operações ou de estabilidade por 24 horas.',
  '',
].join('\n');

fs.mkdirSync('results/load', { recursive: true });
fs.writeFileSync('results/load/evidence.json', JSON.stringify(evidence, null, 2) + '\n');
fs.writeFileSync('results/load/report.md', report);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '\n' + report);
console.log(report);
if (!approved) process.exitCode = 1;
