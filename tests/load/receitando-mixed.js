import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

const base = (__ENV.BASE_URL || 'http://127.0.0.1:8787').replace(/\/$/, '');
const successesWrite = new Counter('successful_writes');
const successesRead = new Counter('successful_reads');
const errors = new Rate('application_errors');

// Cada iteração realiza 1 INSERT confirmado e 2 SELECTs confirmados.
// Carga curta e progressiva para diagnosticar gargalos antes da meta de 3 milhões.
export const options = {
  stages: [
    { duration: '15s', target: 2 },
    { duration: '30s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    application_errors: ['rate<0.01'],
    successful_writes: ['count>0'],
    successful_reads: ['count>0'],
  },
};

export default function () {
  const write = http.post(base + '/api/internal/load-benchmark', null, {
    timeout: '15s', tags: { operation: 'write' },
  });
  const writeOk = check(write, { 'write 201': r => r.status === 201 && r.json('ok') === true });
  if (writeOk) successesWrite.add(1);
  errors.add(!writeOk);

  for (let i = 0; i < 2; i++) {
    const read = http.get(base + '/api/internal/load-benchmark', {
      timeout: '15s', tags: { operation: 'read' },
    });
    const readOk = check(read, { 'read 200': r => r.status === 200 && r.json('ok') === true && typeof r.json('total') === 'number' });
    if (readOk) successesRead.add(1);
    errors.add(!readOk);
  }
  sleep(0.5);
}
