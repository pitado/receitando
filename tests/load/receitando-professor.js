import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const base = (__ENV.BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const writes = new Counter('successful_writes');
const reads = new Counter('successful_reads');
const targetWrites = Number(__ENV.TARGET_WRITES || 1000000);
const targetReads = Number(__ENV.TARGET_READS || 2000000);

export const options = {
  scenarios: {
    writes: {
      executor: 'shared-iterations',
      exec: 'write',
      vus: 80,
      iterations: targetWrites,
      maxDuration: '35m',
    },
    reads: {
      executor: 'shared-iterations',
      exec: 'read',
      vus: 160,
      iterations: targetReads,
      maxDuration: '35m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    successful_writes: [`count>=${targetWrites}`],
    successful_reads: [`count>=${targetReads}`],
  },
};

export function write() {
  const response = http.post(base + '/api/internal/load-benchmark', null, { timeout: '15s', tags: { operation: 'write' } });
  const ok = check(response, { 'write 201': (r) => r.status === 201 });
  if (ok) writes.add(1);
}

export function read() {
  const response = http.get(base + '/api/internal/load-benchmark', { timeout: '15s', tags: { operation: 'read' } });
  const ok = check(response, { 'read 200': (r) => r.status === 200 });
  if (ok) reads.add(1);
}
