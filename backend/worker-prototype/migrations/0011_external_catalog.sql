PRAGMA foreign_keys = ON;

ALTER TABLE recipes ADD COLUMN external_source TEXT;
ALTER TABLE recipes ADD COLUMN external_id TEXT;
ALTER TABLE recipes ADD COLUMN external_category TEXT;
ALTER TABLE recipes ADD COLUMN external_subcategory TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_recipes_external_identity
  ON recipes(external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipes_external_category
  ON recipes(external_category);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id
  ON recipe_ingredients(recipe_id);
