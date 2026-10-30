import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

// Local workerd + real WebSocket transport. Never touches production/D1 users.
const base = 'http://127.0.0.1:8792';
const origin = 'http://localhost:3000';
const state = await mkdtemp(join(tmpdir(), 'receitando-ws-'));
const processWorker = spawn(process.execPath, ['node_modules/wrangler/bin/wrangler.js', 'dev', '--local', '--ip', '127.0.0.1', '--port', '8792', '--inspector-port', '8793', '--persist-to', state, '--log-level', 'warn'], {
  env: { ...process.env, WRANGLER_SEND_METRICS: 'false' }, stdio: ['ignore', 'pipe', 'pipe'],
});
let output = '';
processWorker.stdout.on('data', chunk => { output += chunk; });
processWorker.stderr.on('data', chunk => { output += chunk; });
const sockets = [];
function log(test, detail) { console.log(JSON.stringify({ timestamp: new Date().toISOString(), test, ...detail })); }
async function http(path, options = {}) {
  const response = await fetch(base + path, { ...options, signal: AbortSignal.timeout(3000), headers: { Origin: origin, 'Content-Type': 'application/json', ...options.headers } });
  return response;
}
async function open(path) {
  const ws = new WebSocket(base.replace('http:', 'ws:') + path + '/ws');
  sockets.push(ws);
  const events = [];
  ws.addEventListener('message', event => events.push(JSON.parse(event.data)));
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WebSocket open timeout')), 5000);
    ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
    ws.addEventListener('error', () => { clearTimeout(timer); reject(new Error('WebSocket handshake failed')); }, { once: true });
  });
  return { ws, events, async wait(predicate) {
    for (let n = 0; n < 250; n++) {
      const index = events.findIndex(predicate);
      if (index >= 0) return events.splice(index, 1)[0];
      await delay(20);
    }
    throw new Error('Missing WebSocket event: ' + JSON.stringify(events));
  } };
}
function set(client, stepIndex, completed) { client.ws.send(JSON.stringify({ type: 'step:set', stepIndex, completed })); }
const stateEvent = version => m => m.type === 'room:state' && m.version === version;
try {
  let ready = false;
  for (let n = 0; n < 100; n++) {
    try { if ((await http('/api/health')).ok) { ready = true; break; } } catch { /* booting */ }
    if (processWorker.exitCode !== null) throw new Error('Worker exited: ' + output);
    await delay(200);
  }
  assert.ok(ready, output);
  const payload = { recipeSlug: 'teste-websocket', title: 'Teste isolado', steps: ['A', 'B', 'C', 'D'] };
  assert.equal((await http('/api/v2/cooking-rooms', { method: 'POST', body: JSON.stringify({ ...payload, title: ' ' }) })).status, 400);
  assert.equal((await http('/api/v2/cooking-rooms', { method: 'POST', body: JSON.stringify(payload), headers: { Origin: 'https://untrusted.example' } })).status, 403);
  const created = await http('/api/v2/cooking-rooms', { method: 'POST', body: JSON.stringify(payload) });
  assert.equal(created.status, 201);
  assert.equal(created.headers.get('access-control-allow-origin'), origin);
  assert.equal(created.headers.get('access-control-allow-credentials'), 'true');
  const { id } = await created.json();
  const path = '/api/v2/cooking-rooms/' + id;
  assert.equal((await http(path + '/ws')).status, 426);
  log('creation_and_validation', { passed: true });
  const a = await open(path), b = await open(path);
  await Promise.all([a.wait(m => m.onlineCount === 2), b.wait(m => m.onlineCount === 2)]);
  set(a, 0, true);
  const first = await Promise.all([a.wait(stateEvent(1)), b.wait(stateEvent(1))]);
  assert.deepEqual(first[0].completed, first[1].completed);
  assert.deepEqual(first[0].completed, [true, false, false, false]);
  set(b, 1, true);
  await Promise.all([a.wait(stateEvent(2)), b.wait(stateEvent(2))]);
  log('bidirectional_sync', { passed: true });
  set(a, 2, true); set(b, 3, true);
  const simultaneous = await Promise.all([a.wait(stateEvent(4)), b.wait(stateEvent(4))]);
  assert.deepEqual(simultaneous[0].completed, [true, true, true, true]);
  assert.deepEqual(simultaneous[0].completed, simultaneous[1].completed);
  set(a, 2, true);
  await a.wait(stateEvent(4));
  a.ws.send('null'); a.ws.send('invalid'); set(a, -1, false);
  assert.equal((await (await http(path)).json()).version, 4);
  log('concurrent_updates_idempotency_invalid_messages', { passed: true });
  b.ws.close();
  await a.wait(m => m.type === 'presence:update' && m.onlineCount === 1);
  set(a, 0, false); await a.wait(stateEvent(5));
  const rejoined = await open(path);
  const restored = await rejoined.wait(stateEvent(5));
  assert.deepEqual(restored.completed, [false, true, true, true]);
  set(rejoined, 1, false); await a.wait(stateEvent(6));
  log('disconnect_reconnect_latest_state', { passed: true });
  rejoined.ws.send('{"type":"ping"}'); await rejoined.wait(m => m.type === 'pong');
  log('heartbeat', { passed: true });
  rejoined.ws.close(); await a.wait(m => m.type === 'presence:update' && m.onlineCount === 1);
  a.ws.close();
  for (let n = 0; n < 50; n++) {
    if ((await (await http(path)).json()).onlineCount === 0) break;
    await delay(20);
  }
  assert.equal((await (await http(path)).json()).onlineCount, 0);
  log('connections_closed', { passed: true });
} catch (error) {
  console.error(output);
  throw error;
} finally {
  for (const socket of sockets) socket.close();
  processWorker.kill('SIGTERM');
  await new Promise(resolve => { if (processWorker.exitCode !== null) resolve(); else processWorker.once('exit', resolve); });
  await rm(state, { recursive: true, force: true });
}
