PRAGMA foreign_keys = ON;

ALTER TABLE recipes ADD COLUMN image_source TEXT;
ALTER TABLE recipes ADD COLUMN image_author TEXT;
ALTER TABLE recipes ADD COLUMN image_page_url TEXT;
ALTER TABLE recipes ADD COLUMN image_license TEXT;
ALTER TABLE recipes ADD COLUMN image_license_url TEXT;
ALTER TABLE recipes ADD COLUMN image_alt TEXT;

CREATE INDEX IF NOT EXISTS idx_recipes_image_source
  ON recipes(image_source);
