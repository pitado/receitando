-- Somente ponteiros editoriais. Nenhum texto de receita ou fotografia de terceiros é armazenado.
CREATE TABLE IF NOT EXISTS external_recipe_references (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL UNIQUE,
  source_author TEXT,
  terms_url TEXT NOT NULL,
  rights TEXT NOT NULL DEFAULT 'link_only' CHECK (rights = 'link_only'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_external_recipe_references_source
ON external_recipe_references(source_name, title);
CREATE INDEX IF NOT EXISTS idx_external_recipe_references_category
ON external_recipe_references(category, title);
