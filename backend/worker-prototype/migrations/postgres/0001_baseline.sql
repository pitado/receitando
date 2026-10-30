-- PostgreSQL schema generated from Receitando production D1 schema (2026-10-30); does not contain user data.
-- Session and date fields are text for compatibility with existing API.
BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  updated_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
, handle TEXT, avatar_key TEXT NOT NULL DEFAULT 'tomato');

CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  updated_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
, is_staple INTEGER NOT NULL DEFAULT 0 CHECK (is_staple IN (0, 1)));

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  prep_minutes INTEGER NOT NULL,
  servings INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  updated_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
, meal_type TEXT NOT NULL DEFAULT 'outros', difficulty TEXT NOT NULL DEFAULT 'FACIL' CHECK (difficulty IN ('FACIL', 'MEDIA', 'DIFICIL')), source_type TEXT NOT NULL DEFAULT 'OWN' CHECK (source_type IN ('OWN', 'OPEN_DATASET', 'USER')), source_name TEXT NOT NULL DEFAULT 'Receitando', image_url TEXT, external_source TEXT, external_id TEXT, external_category TEXT, external_subcategory TEXT, source_url TEXT, source_author TEXT, source_license TEXT, source_license_url TEXT, source_language TEXT, imported_at TEXT, image_source TEXT, image_author TEXT, image_page_url TEXT, image_license TEXT, image_license_url TEXT, image_alt TEXT);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  last_seen_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ingredient_aliases (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  ingredient_id TEXT NOT NULL,
  quantity REAL,
  unit TEXT,
  optional INTEGER NOT NULL DEFAULT 0 CHECK (optional IN (0, 1)), raw_text TEXT,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
  UNIQUE (recipe_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS pantry_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  ingredient_id TEXT NOT NULL,
  quantity REAL,
  unit TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  updated_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
  UNIQUE (user_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id TEXT NOT NULL,
  recipe_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (recipe_id, tag),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipe_votes (
  user_id TEXT NOT NULL,
  recipe_id TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('LIKE', 'DISLIKE')),
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  updated_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipe_comments (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  updated_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_reset_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  reset_token_hash TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  verified_at TEXT,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recipe_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  author_name TEXT NOT NULL,
  author_email TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  ingredients TEXT NOT NULL,
  instructions TEXT NOT NULL,
  prep_minutes INTEGER,
  servings INTEGER,
  meal_type TEXT,
  difficulty TEXT NOT NULL DEFAULT 'FACIL' CHECK (difficulty IN ('FACIL', 'MEDIA', 'DIFICIL')),
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL, reviewed_by TEXT, reviewed_at TEXT, published_recipe_id TEXT, rejection_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS auth_rate_limit_events (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS load_benchmark (id TEXT PRIMARY KEY, created_at TEXT DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')));

CREATE INDEX IF NOT EXISTS idx_auth_rate_limit_events_created_at
  ON auth_rate_limit_events (created_at);
CREATE INDEX IF NOT EXISTS idx_auth_rate_limit_events_lookup
  ON auth_rate_limit_events (action, key_hash, created_at);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_created_at
  ON favorites(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ingredient_aliases_ingredient_id
  ON ingredient_aliases(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_pantry_items_expires_at ON pantry_items(expires_at);
CREATE INDEX IF NOT EXISTS idx_pantry_items_ingredient_id ON pantry_items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id
  ON pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_updated_at
  ON pantry_items(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at
  ON password_reset_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_user_id
  ON password_reset_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_recipe_id_created_at
  ON recipe_comments(recipe_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_user_id ON recipe_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id
  ON recipe_ingredients(recipe_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_submissions_published_recipe
  ON recipe_submissions(published_recipe_id)
  WHERE published_recipe_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recipe_submissions_reviewed_at
  ON recipe_submissions(reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_submissions_status_created
  ON recipe_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_submissions_user
  ON recipe_submissions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag);
CREATE INDEX IF NOT EXISTS idx_recipe_votes_recipe_id ON recipe_votes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_votes_vote ON recipe_votes(recipe_id, vote);
CREATE INDEX IF NOT EXISTS idx_recipes_external_category
  ON recipes(external_category);
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_external_identity
  ON recipes(external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_external_source
  ON recipes(external_source);
CREATE INDEX IF NOT EXISTS idx_recipes_image_source
  ON recipes(image_source);
CREATE INDEX IF NOT EXISTS idx_recipes_source_name
  ON recipes(source_name);
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_handle_unique
ON users(handle)
WHERE handle IS NOT NULL;

-- FTS5 replacement: indexed PostgreSQL Portuguese full-text search.
CREATE INDEX IF NOT EXISTS idx_recipes_search_tsv ON recipes USING GIN (to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(description,'')));
CREATE OR REPLACE VIEW recipe_search AS SELECT id AS recipe_id, title, description, to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(description,'')) AS search_vector FROM recipes;
COMMIT;
