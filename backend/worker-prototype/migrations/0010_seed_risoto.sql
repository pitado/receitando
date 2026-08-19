-- Receita própria Receitando: risoto simples para ampliar o catálogo.
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO recipes (
  id,
  title,
  slug,
  description,
  instructions,
  prep_minutes,
  servings,
  meal_type,
  difficulty,
  source_type,
  source_name
) VALUES (
  'rec-risoto-tomate-parmesao',
  'Risoto cremoso de tomate e parmesão',
  'risoto-tomate-parmesao',
  'Arroz cremoso com tomate, parmesão e um preparo paciente de panela.',
  '1. Pique a cebola, o alho e o tomate.\n2. Aqueça o azeite com metade da manteiga e refogue a cebola até ficar macia.\n3. Junte o alho, o tomate e o arroz e mexa por cerca de um minuto.\n4. Adicione água quente aos poucos, uma concha por vez, mexendo e esperando o líquido quase secar antes da próxima adição.\n5. Continue até o arroz ficar cozido e cremoso, mas ainda firme.\n6. Desligue o fogo, misture o restante da manteiga e o parmesão e sirva imediatamente.',
  35,
  3,
  'almoco-jantar',
  'MEDIA',
  'OWN',
  'Receitando'
);

INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-risoto-tomate-parmesao', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-risoto-tomate-parmesao', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-risoto-tomate-parmesao', 'cremosa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-risoto-tomate-parmesao', 'uma-panela');

INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-risoto-001', 'rec-risoto-tomate-parmesao', 'ing-arroz', 1.5, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-risoto-002', 'rec-risoto-tomate-parmesao', 'ing-tomate', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-risoto-003', 'rec-risoto-tomate-parmesao', 'ing-cebola', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-risoto-004', 'rec-risoto-tomate-parmesao', 'ing-alho', 1, 'dente', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-risoto-005', 'rec-risoto-tomate-parmesao', 'ing-manteiga', 2, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-risoto-006', 'rec-risoto-tomate-parmesao', 'ing-parmesao', 60, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-risoto-007', 'rec-risoto-tomate-parmesao', 'ing-azeite', 1, 'colher de sopa', 1);
