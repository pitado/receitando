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
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_recipe_submissions_status_created
  ON recipe_submissions(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipe_submissions_user
  ON recipe_submissions(user_id, created_at DESC);
