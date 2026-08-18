ALTER TABLE users ADD COLUMN handle TEXT;
ALTER TABLE users ADD COLUMN avatar_key TEXT NOT NULL DEFAULT 'tomato';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle_unique
ON users(handle)
WHERE handle IS NOT NULL;
