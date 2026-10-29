import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errors = new Rate('application_errors');
const base = (__ENV.BASE_URL || 'http://localhost:8787').replace(/\/$/, '');
const mode = __ENV.MODE || 'smoke';
const stages = mode === 'load'
  ? [{ duration: '30s', target: 5 }, { duration: '1m', target: 20 }, { duration: '30s', target: 0 }]
  : [{ duration: '10s', target: 2 }, { duration: '20s', target: 2 }, { duration: '10s', target: 0 }];

export const options = {
  stages,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
    application_errors: ['rate<0.01'],
  },
};

export default function () {
  const path = Math.random() < 0.7 ? '/api/v2/recipes?limit=12' : '/api/health';
  const response = http.get(base + path, { tags: { endpoint: path.split('?')[0] } });
  const ok = check(response, {
    'status 200': (r) => r.status === 200,
    'JSON response': (r) => (r.headers['Content-Type'] || '').includes('application/json'),
  });
  errors.add(!ok);
  sleep(1);
}
