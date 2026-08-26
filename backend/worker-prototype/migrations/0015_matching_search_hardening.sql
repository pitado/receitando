-- Regras de matching, índices de acesso frequente e busca textual.
-- O D1 mantém foreign keys ativas por padrão; esta migration não desabilita a validação.

ALTER TABLE ingredients
  ADD COLUMN is_staple INTEGER NOT NULL DEFAULT 0 CHECK (is_staple IN (0, 1));

-- Ingredientes básicos não penalizam a compatibilidade. Açúcar fica fora de propósito,
-- pois em muitas receitas ele é ingrediente estrutural e não apenas um item trivial.
UPDATE ingredients
SET is_staple = 1
WHERE normalized_name IN (
  'agua',
  'sal',
  'pimenta',
  'pimenta do reino',
  'oleo',
  'oleo vegetal',
  'oleo de cozinha'
);

-- Índices para os filtros/ordenações mais frequentes. Alguns relacionamentos já possuem
-- índices automáticos por PRIMARY KEY/UNIQUE; os abaixo cobrem acessos que não eram
-- atendidos pelo prefixo desses índices.
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id
  ON pantry_items(user_id);

CREATE INDEX IF NOT EXISTS idx_pantry_items_user_updated_at
  ON pantry_items(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id
  ON recipe_ingredients(recipe_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_created_at
  ON favorites(user_id, created_at DESC);

-- D1 suporta SQLite FTS5. A tabela virtual evita table scan com LIKE '%termo%'
-- na busca do catálogo e mantém título/descrição sincronizados por triggers.
CREATE VIRTUAL TABLE IF NOT EXISTS recipe_search USING fts5(
  recipe_id UNINDEXED,
  title,
  description,
  tokenize = 'unicode61 remove_diacritics 2'
);

DELETE FROM recipe_search;
INSERT INTO recipe_search (recipe_id, title, description)
SELECT id, title, description FROM recipes;

CREATE TRIGGER IF NOT EXISTS recipe_search_after_insert
AFTER INSERT ON recipes
BEGIN
  INSERT INTO recipe_search (recipe_id, title, description)
  VALUES (new.id, new.title, new.description);
END;

CREATE TRIGGER IF NOT EXISTS recipe_search_after_delete
AFTER DELETE ON recipes
BEGIN
  DELETE FROM recipe_search WHERE recipe_id = old.id;
END;

CREATE TRIGGER IF NOT EXISTS recipe_search_after_update
AFTER UPDATE OF title, description ON recipes
BEGIN
  DELETE FROM recipe_search WHERE recipe_id = old.id;
  INSERT INTO recipe_search (recipe_id, title, description)
  VALUES (new.id, new.title, new.description);
END;

PRAGMA optimize;
