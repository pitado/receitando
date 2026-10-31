import http from 'k6/http';
import exec from 'k6/execution';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const base = (__ENV.BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const seedId = __ENV.BENCHMARK_SEED_ID || '';
const targetWrites = Number(__ENV.TARGET_WRITES || 1000000);
const targetReads = Number(__ENV.TARGET_READS || 2000000);
if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(seedId)) {
  throw new Error('BENCHMARK_SEED_ID ausente/inválido: execute o smoke de POST/GET primeiro.');
}

const writes = new Counter('successful_writes');
const reads = new Counter('successful_reads');
const appErrors = new Rate('application_errors');
const retries = new Counter('benchmark_retries');
let loggedErrors = 0;

export const options = {
  // Executor com contagem fixa. Rotas são acessadas via Worker e PostgreSQL isolado para benchmark HTTP.
  scenarios: {
    writes: {
      executor: 'shared-iterations',
      exec: 'write',
      vus: 24,
      iterations: targetWrites,
      maxDuration: '135m',
    },
    reads: {
      executor: 'shared-iterations',
      exec: 'read',
      vus: 48,
      iterations: targetReads,
      maxDuration: '135m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    application_errors: ['rate<0.01'],
    successful_writes: [`count>=${targetWrites}`],
    successful_reads: [`count>=${targetReads}`],
  },
};

function requestWithRetries(fn, isValid, kind) {
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = fn();
    if (isValid(response)) return { ok: true, response };
    if (attempt < 2) {
      retries.add(1);
      sleep(0.1 * (attempt + 1));
    }
  }
  if (loggedErrors < 3) {
    console.error(JSON.stringify({
      event: 'failed_logical_operation',
      kind,
      vu: exec.vu.idInTest,
      iteration: exec.scenario.iterationInTest,
      status: response?.status ?? null,
      error: response?.error ?? null,
      body: String(response?.body || '').slice(0, 180),
    }));
    loggedErrors++;
  }
  return { ok: false, response };
}

const verified = (r, status, field, expected) => {
  if (!r || r.status !== status) return false;
  try { return r.json('ok') === true && r.json(field) === expected; }
  catch { return false; }
};

export function write() {
  // ID determinístico exclusivo por iteração: retentativas não duplicam INSERTs.
  const id = '00000000-0000-4000-8000-' +
    (exec.scenario.iterationInTest + 1).toString(16).padStart(12, '0');
  const result = requestWithRetries(
    () => http.post(base + '/api/internal/load-benchmark', null, {
      timeout: '15s',
      headers: { 'X-Benchmark-Id': id },
      tags: { operation: 'write' },
    }),
    r => verified(r, 201, 'id', id),
    'write',
  );
  check(result, { 'write persisted 201': r => r.ok });
  appErrors.add(!result.ok);
  if (result.ok) writes.add(1);
  if (exec.scenario.iterationInTest % 20000 === 0) {
    console.log(JSON.stringify({ event: 'write_progress', iteration: exec.scenario.iterationInTest + 1, target: targetWrites }));
  }
  sleep(0.1);
}

export function read() {
  // SELECT WHERE id = ?; a linha-semente foi persistida e validada antes do teste.
  const result = requestWithRetries(
    () => http.get(base + '/api/internal/load-benchmark?id=' + seedId, {
      timeout: '15s',
      tags: { operation: 'read' },
    }),
    r => verified(r, 200, 'found', true),
    'read',
  );
  check(result, { 'indexed read found row': r => r.ok });
  appErrors.add(!result.ok);
  if (result.ok) reads.add(1);
  if (exec.scenario.iterationInTest % 40000 === 0) {
    console.log(JSON.stringify({ event: 'read_progress', iteration: exec.scenario.iterationInTest + 1, target: targetReads }));
  }
  sleep(0.1);
}
