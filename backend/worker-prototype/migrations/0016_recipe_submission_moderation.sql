PRAGMA foreign_keys = ON;

ALTER TABLE recipe_submissions ADD COLUMN reviewed_by TEXT;
ALTER TABLE recipe_submissions ADD COLUMN reviewed_at TEXT;
ALTER TABLE recipe_submissions ADD COLUMN published_recipe_id TEXT;
ALTER TABLE recipe_submissions ADD COLUMN rejection_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_recipe_submissions_reviewed_at
  ON recipe_submissions(reviewed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_submissions_published_recipe
  ON recipe_submissions(published_recipe_id)
  WHERE published_recipe_id IS NOT NULL;
