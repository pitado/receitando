PRAGMA foreign_keys = ON;

ALTER TABLE recipes ADD COLUMN source_url TEXT;
ALTER TABLE recipes ADD COLUMN source_author TEXT;
ALTER TABLE recipes ADD COLUMN source_license TEXT;
ALTER TABLE recipes ADD COLUMN source_license_url TEXT;
ALTER TABLE recipes ADD COLUMN source_language TEXT;
ALTER TABLE recipes ADD COLUMN imported_at TEXT;

ALTER TABLE recipe_ingredients ADD COLUMN raw_text TEXT;

CREATE INDEX IF NOT EXISTS idx_recipes_external_source
  ON recipes(external_source);

CREATE INDEX IF NOT EXISTS idx_recipes_source_name
  ON recipes(source_name);
