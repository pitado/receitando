import { sha256 } from "./security";

export type AuthRateLimitAction =
  | "login_email"
  | "login_ip"
  | "register_ip"
  | "password_reset_email"
  | "password_reset_ip";

type RateLimitStatement = {
  bind: (...values: unknown[]) => RateLimitStatement;
  first: <T>() => Promise<T | null>;
  run: () => Promise<unknown>;
};

export type RateLimitDatabase = {
  prepare: (query: string) => RateLimitStatement;
};

export type RateLimitPolicy = {
  maxAttempts: number;
  windowMs: number;
};

export type RateLimitStatus = {
  attempts: number;
  blocked: boolean;
  retryAfterSeconds: number;
};

export const AUTH_RATE_LIMIT_POLICIES: Record<AuthRateLimitAction, RateLimitPolicy> = {
  login_email: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  login_ip: { maxAttempts: 20, windowMs: 15 * 60 * 1000 },
  register_ip: { maxAttempts: 5, windowMs: 60 * 60 * 1000 },
  password_reset_email: { maxAttempts: 3, windowMs: 15 * 60 * 1000 },
  password_reset_ip: { maxAttempts: 10, windowMs: 15 * 60 * 1000 },
};

const RETENTION_MS = 2 * 60 * 60 * 1000;

export function clientIp(request: Request): string | null {
  const value = request.headers.get("CF-Connecting-IP")?.trim();
  return value ? value.slice(0, 128) : null;
}

async function keyHash(action: AuthRateLimitAction, value: string): Promise<string> {
  return sha256(`${action}:${value.trim().toLowerCase()}`);
}

export async function getRateLimitStatus(
  db: RateLimitDatabase,
  action: AuthRateLimitAction,
  value: string | null,
  nowMs = Date.now(),
): Promise<RateLimitStatus> {
  if (!value) return { attempts: 0, blocked: false, retryAfterSeconds: 0 };

  const policy = AUTH_RATE_LIMIT_POLICIES[action];
  const hash = await keyHash(action, value);
  const since = new Date(nowMs - policy.windowMs).toISOString();
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS attempts, MIN(created_at) AS oldestAt
       FROM auth_rate_limit_events
       WHERE action = ? AND key_hash = ? AND created_at > ?`,
    )
    .bind(action, hash, since)
    .first<{ attempts: number; oldestAt: string | null }>();

  const attempts = Number(row?.attempts ?? 0);
  if (attempts < policy.maxAttempts || !row?.oldestAt) {
    return { attempts, blocked: false, retryAfterSeconds: 0 };
  }

  const oldestMs = new Date(row.oldestAt).getTime();
  const remainingMs = Math.max(1_000, oldestMs + policy.windowMs - nowMs);
  return {
    attempts,
    blocked: true,
    retryAfterSeconds: Math.max(1, Math.ceil(remainingMs / 1000)),
  };
}

export async function recordRateLimitEvent(
  db: RateLimitDatabase,
  action: AuthRateLimitAction,
  value: string | null,
  nowMs = Date.now(),
): Promise<void> {
  if (!value) return;

  const hash = await keyHash(action, value);
  const createdAt = new Date(nowMs).toISOString();
  await db
    .prepare("INSERT INTO auth_rate_limit_events (id, action, key_hash, created_at) VALUES (?, ?, ?, ?)")
    .bind(crypto.randomUUID(), action, hash, createdAt)
    .run();

  const retentionCutoff = new Date(nowMs - RETENTION_MS).toISOString();
  await db.prepare("DELETE FROM auth_rate_limit_events WHERE created_at < ?").bind(retentionCutoff).run();
}

export async function clearRateLimitEvents(
  db: RateLimitDatabase,
  action: AuthRateLimitAction,
  value: string | null,
): Promise<void> {
  if (!value) return;
  const hash = await keyHash(action, value);
  await db.prepare("DELETE FROM auth_rate_limit_events WHERE action = ? AND key_hash = ?").bind(action, hash).run();
}
