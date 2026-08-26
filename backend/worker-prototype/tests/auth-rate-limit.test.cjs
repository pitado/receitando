const test = require("node:test");
const assert = require("node:assert/strict");

const {
  AUTH_RATE_LIMIT_POLICIES,
  clearRateLimitEvents,
  clientIp,
  getRateLimitStatus,
  recordRateLimitEvent,
} = require("../.test-dist/lib/auth-rate-limit.js");

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.args = [];
  }

  bind(...args) {
    this.args = args;
    return this;
  }

  async first() {
    if (!this.sql.includes("SELECT COUNT(*) AS attempts")) {
      throw new Error(`Consulta não suportada no fake: ${this.sql}`);
    }
    const [action, keyHash, since] = this.args;
    const matches = this.db.events
      .filter((event) => event.action === action && event.keyHash === keyHash && event.createdAt > since)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return {
      attempts: matches.length,
      oldestAt: matches[0]?.createdAt ?? null,
    };
  }

  async run() {
    if (this.sql.startsWith("INSERT INTO auth_rate_limit_events")) {
      const [id, action, keyHash, createdAt] = this.args;
      this.db.events.push({ id, action, keyHash, createdAt });
      return {};
    }

    if (this.sql.startsWith("DELETE FROM auth_rate_limit_events WHERE created_at <")) {
      const [cutoff] = this.args;
      this.db.events = this.db.events.filter((event) => event.createdAt >= cutoff);
      return {};
    }

    if (this.sql.startsWith("DELETE FROM auth_rate_limit_events WHERE action =")) {
      const [action, keyHash] = this.args;
      this.db.events = this.db.events.filter(
        (event) => !(event.action === action && event.keyHash === keyHash),
      );
      return {};
    }

    throw new Error(`Comando não suportado no fake: ${this.sql}`);
  }
}

class FakeDb {
  constructor() {
    this.events = [];
  }

  prepare(sql) {
    return new FakeStatement(this, sql);
  }
}

test("extrai o IP fornecido pela Cloudflare", () => {
  const request = new Request("https://api.example.test/api/auth/login", {
    headers: { "CF-Connecting-IP": "203.0.113.9" },
  });
  assert.equal(clientIp(request), "203.0.113.9");
  assert.equal(clientIp(new Request("https://api.example.test")), null);
});

test("bloqueia o mesmo e-mail após cinco falhas em quinze minutos", async () => {
  const db = new FakeDb();
  const now = Date.parse("2026-08-25T20:00:00.000Z");
  const email = "Pessoa@Example.com";

  for (let index = 0; index < AUTH_RATE_LIMIT_POLICIES.login_email.maxAttempts; index += 1) {
    await recordRateLimitEvent(db, "login_email", email, now + index * 1000);
  }

  const status = await getRateLimitStatus(db, "login_email", email.toLowerCase(), now + 5_000);
  assert.equal(status.blocked, true);
  assert.equal(status.attempts, 5);
  assert.ok(status.retryAfterSeconds > 0);
  assert.ok(status.retryAfterSeconds <= 15 * 60);

  assert.equal(db.events.some((event) => event.keyHash.includes("example.com")), false);
});

test("libera novamente quando a janela de login expira", async () => {
  const db = new FakeDb();
  const now = Date.parse("2026-08-25T20:00:00.000Z");
  const email = "pessoa@example.com";

  for (let index = 0; index < 5; index += 1) {
    await recordRateLimitEvent(db, "login_email", email, now + index * 1000);
  }

  const afterWindow = now + AUTH_RATE_LIMIT_POLICIES.login_email.windowMs + 10_000;
  const status = await getRateLimitStatus(db, "login_email", email, afterWindow);
  assert.equal(status.blocked, false);
  assert.equal(status.attempts, 0);
});

test("um login bem-sucedido pode limpar apenas o bucket do e-mail", async () => {
  const db = new FakeDb();
  const now = Date.parse("2026-08-25T20:00:00.000Z");

  await recordRateLimitEvent(db, "login_email", "pessoa@example.com", now);
  await recordRateLimitEvent(db, "login_ip", "203.0.113.9", now);
  await clearRateLimitEvents(db, "login_email", "pessoa@example.com");

  const emailStatus = await getRateLimitStatus(db, "login_email", "pessoa@example.com", now + 1000);
  const ipStatus = await getRateLimitStatus(db, "login_ip", "203.0.113.9", now + 1000);
  assert.equal(emailStatus.attempts, 0);
  assert.equal(ipStatus.attempts, 1);
});

test("cadastro por IP usa uma janela mais longa e limite próprio", async () => {
  const db = new FakeDb();
  const now = Date.parse("2026-08-25T20:00:00.000Z");
  const ip = "198.51.100.20";

  for (let index = 0; index < AUTH_RATE_LIMIT_POLICIES.register_ip.maxAttempts; index += 1) {
    await recordRateLimitEvent(db, "register_ip", ip, now + index * 1000);
  }

  const status = await getRateLimitStatus(db, "register_ip", ip, now + 5_000);
  assert.equal(status.blocked, true);
  assert.equal(status.attempts, 5);
  assert.ok(status.retryAfterSeconds <= 60 * 60);
});

test("recuperação de senha possui buckets separados por e-mail e IP", async () => {
  const db = new FakeDb();
  const now = Date.parse("2026-08-25T20:00:00.000Z");
  const email = "pessoa@example.com";
  const ip = "203.0.113.20";

  for (let index = 0; index < AUTH_RATE_LIMIT_POLICIES.password_reset_email.maxAttempts; index += 1) {
    await recordRateLimitEvent(db, "password_reset_email", email, now + index * 1000);
  }
  await recordRateLimitEvent(db, "password_reset_ip", ip, now);

  const emailStatus = await getRateLimitStatus(db, "password_reset_email", email, now + 4_000);
  const ipStatus = await getRateLimitStatus(db, "password_reset_ip", ip, now + 4_000);

  assert.equal(emailStatus.blocked, true);
  assert.equal(emailStatus.attempts, 3);
  assert.equal(ipStatus.blocked, false);
  assert.equal(ipStatus.attempts, 1);
  assert.equal(db.events.some((event) => event.keyHash.includes("pessoa@example.com")), false);
});
