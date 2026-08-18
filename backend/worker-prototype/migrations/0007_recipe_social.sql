PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS recipe_votes (
  user_id TEXT NOT NULL,
  recipe_id TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('LIKE', 'DISLIKE')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipe_votes_recipe_id ON recipe_votes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_votes_vote ON recipe_votes(recipe_id, vote);

CREATE TABLE IF NOT EXISTS recipe_comments (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipe_comments_recipe_id_created_at
  ON recipe_comments(recipe_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_user_id ON recipe_comments(user_id);
