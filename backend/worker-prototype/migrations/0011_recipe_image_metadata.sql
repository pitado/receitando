PRAGMA foreign_keys = ON;

ALTER TABLE recipes ADD COLUMN image_source TEXT;
ALTER TABLE recipes ADD COLUMN image_author TEXT;
ALTER TABLE recipes ADD COLUMN image_source_url TEXT;

CREATE INDEX IF NOT EXISTS idx_recipes_image_source ON recipes(image_source);
