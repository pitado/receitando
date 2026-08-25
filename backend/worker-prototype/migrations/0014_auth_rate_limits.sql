CREATE TABLE IF NOT EXISTS auth_rate_limit_events (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limit_events_lookup
  ON auth_rate_limit_events (action, key_hash, created_at);

CREATE INDEX IF NOT EXISTS idx_auth_rate_limit_events_created_at
  ON auth_rate_limit_events (created_at);
