PRAGMA foreign_keys = ON;

ALTER TABLE recipes ADD COLUMN meal_type TEXT NOT NULL DEFAULT 'outros';
ALTER TABLE recipes ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'FACIL' CHECK (difficulty IN ('FACIL', 'MEDIA', 'DIFICIL'));
ALTER TABLE recipes ADD COLUMN source_type TEXT NOT NULL DEFAULT 'OWN' CHECK (source_type IN ('OWN', 'OPEN_DATASET', 'USER'));
ALTER TABLE recipes ADD COLUMN source_name TEXT NOT NULL DEFAULT 'Receitando';
ALTER TABLE recipes ADD COLUMN image_url TEXT;

CREATE TABLE IF NOT EXISTS ingredient_aliases (
  id TEXT PRIMARY KEY,
  ingredient_id TEXT NOT NULL,
  alias TEXT NOT NULL,
  normalized_alias TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ingredient_aliases_ingredient_id
  ON ingredient_aliases(ingredient_id);

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (recipe_id, tag),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag);

INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES
  ('alias-ovo-ovos', 'ing-ovo', 'Ovos', 'ovos'),
  ('alias-farinha-farinha', 'ing-farinha-trigo', 'Farinha', 'farinha'),
  ('alias-farinha-trigo-curto', 'ing-farinha-trigo', 'Farinha trigo', 'farinha trigo'),
  ('alias-leite-integral', 'ing-leite', 'Leite integral', 'leite integral'),
  ('alias-fermento-quimico', 'ing-fermento', 'Fermento químico', 'fermento quimico'),
  ('alias-macarrao-massa', 'ing-macarrao', 'Massa', 'massa'),
  ('alias-macarrao-macarrao-seco', 'ing-macarrao', 'Macarrão seco', 'macarrao seco'),
  ('alias-oleo-cozinha', 'ing-oleo', 'Óleo de cozinha', 'oleo de cozinha'),
  ('alias-acucar-refinado', 'ing-acucar', 'Açúcar refinado', 'acucar refinado'),
  ('alias-queijo-mussarela', 'ing-queijo', 'Mussarela', 'mussarela'),
  ('alias-queijo-mozzarella', 'ing-queijo', 'Mozzarella', 'mozzarella');

UPDATE recipes SET meal_type = 'cafe-da-manha', difficulty = 'FACIL' WHERE id IN ('rec-panqueca-banana', 'rec-panqueca-simples', 'rec-omelete-tomate', 'rec-omelete-queijo');
UPDATE recipes SET meal_type = 'sobremesa', difficulty = 'FACIL' WHERE id = 'rec-bolo-banana';
UPDATE recipes SET meal_type = 'almoco-jantar', difficulty = 'FACIL' WHERE id IN ('rec-arroz-legumes', 'rec-macarrao-alho-oleo', 'rec-pure-batata');

INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES
  ('rec-panqueca-banana', 'rapida'),
  ('rec-panqueca-banana', 'cafe-da-manha'),
  ('rec-bolo-banana', 'bolo'),
  ('rec-bolo-banana', 'caseira'),
  ('rec-omelete-tomate', 'rapida'),
  ('rec-arroz-legumes', 'dia-a-dia'),
  ('rec-macarrao-alho-oleo', 'rapida'),
  ('rec-pure-batata', 'acompanhamento'),
  ('rec-panqueca-simples', 'versatil'),
  ('rec-omelete-queijo', 'rapida');
