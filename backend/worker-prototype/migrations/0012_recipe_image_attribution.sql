PRAGMA foreign_keys = ON;

ALTER TABLE recipes ADD COLUMN image_source TEXT;
ALTER TABLE recipes ADD COLUMN image_author TEXT;
ALTER TABLE recipes ADD COLUMN image_page_url TEXT;
ALTER TABLE recipes ADD COLUMN image_alt TEXT;

DELETE FROM recipes
WHERE source_type = 'OPEN_DATASET'
  AND external_source = 'recipes-dataset-64k-dishes'
  AND (image_url IS NULL OR TRIM(image_url) = '');

CREATE INDEX IF NOT EXISTS idx_recipes_image_source
  ON recipes(image_source);
