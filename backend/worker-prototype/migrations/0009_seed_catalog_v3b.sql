-- Complemento da expansão v3: catálogo chega a aproximadamente 100 receitas
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-salada-grao-bico-tomate', 'Salada de grão-de-bico com tomate', 'salada-grao-bico-tomate', 'Salada fresca e prática com grão-de-bico, tomate e limão.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 12, 3, 'acompanhamento', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-salada-grao-bico-tomate', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-salada-grao-bico-tomate', 'salada');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-salada-grao-bico-tomate', 'sem-fogao');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3001', 'rec-v3b-salada-grao-bico-tomate', 'ing-grao-bico', 2, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3002', 'rec-v3b-salada-grao-bico-tomate', 'ing-tomate', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3003', 'rec-v3b-salada-grao-bico-tomate', 'ing-cebola', 0.5, 'unidade', 1);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3004', 'rec-v3b-salada-grao-bico-tomate', 'ing-limao', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3005', 'rec-v3b-salada-grao-bico-tomate', 'ing-azeite', 1, 'colher de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-salada-repolho-cenoura', 'Salada de repolho e cenoura', 'salada-repolho-cenoura', 'Salada crocante e simples para acompanhar o almoço.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 10, 4, 'acompanhamento', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-salada-repolho-cenoura', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-salada-repolho-cenoura', 'salada');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-salada-repolho-cenoura', 'sem-fogao');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3006', 'rec-v3b-salada-repolho-cenoura', 'ing-repolho', 2, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3007', 'rec-v3b-salada-repolho-cenoura', 'ing-cenoura', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3008', 'rec-v3b-salada-repolho-cenoura', 'ing-limao', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3009', 'rec-v3b-salada-repolho-cenoura', 'ing-azeite', 1, 'colher de sopa', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-salada-pepino-tomate', 'Salada de pepino e tomate', 'salada-pepino-tomate', 'Salada leve, fresca e pronta em poucos minutos.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 8, 3, 'acompanhamento', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-salada-pepino-tomate', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-salada-pepino-tomate', 'salada');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-salada-pepino-tomate', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3010', 'rec-v3b-salada-pepino-tomate', 'ing-pepino', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3011', 'rec-v3b-salada-pepino-tomate', 'ing-tomate', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3012', 'rec-v3b-salada-pepino-tomate', 'ing-cebola', 0.5, 'unidade', 1);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3013', 'rec-v3b-salada-pepino-tomate', 'ing-azeite', 1, 'colher de sopa', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-salada-rucula-manga', 'Salada de rúcula com manga', 'salada-rucula-manga', 'Folhas frescas com manga madura e toque cítrico.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 10, 2, 'acompanhamento', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-salada-rucula-manga', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-salada-rucula-manga', 'salada');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-salada-rucula-manga', 'frutada');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3014', 'rec-v3b-salada-rucula-manga', 'ing-rucula', 2, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3015', 'rec-v3b-salada-rucula-manga', 'ing-manga', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3016', 'rec-v3b-salada-rucula-manga', 'ing-limao', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3017', 'rec-v3b-salada-rucula-manga', 'ing-azeite', 1, 'colher de sopa', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-couve-alho', 'Couve refogada com alho', 'couve-alho', 'Couve fininha refogada rapidamente com alho.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 12, 3, 'acompanhamento', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-couve-alho', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-couve-alho', 'acompanhamento');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-couve-alho', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3018', 'rec-v3b-couve-alho', 'ing-couve', 1, 'maço', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3019', 'rec-v3b-couve-alho', 'ing-alho', 2, 'dentes', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3020', 'rec-v3b-couve-alho', 'ing-azeite', 1, 'colher de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-abobrinha-refogada', 'Abobrinha refogada', 'abobrinha-refogada', 'Abobrinha macia com alho e cebola.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 15, 3, 'acompanhamento', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-abobrinha-refogada', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-abobrinha-refogada', 'acompanhamento');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-abobrinha-refogada', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3021', 'rec-v3b-abobrinha-refogada', 'ing-abobrinha', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3022', 'rec-v3b-abobrinha-refogada', 'ing-alho', 1, 'dente', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3023', 'rec-v3b-abobrinha-refogada', 'ing-cebola', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3024', 'rec-v3b-abobrinha-refogada', 'ing-azeite', 1, 'colher de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-cenoura-manteiga', 'Cenoura na manteiga', 'cenoura-manteiga', 'Cenoura macia e brilhante com manteiga.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 20, 3, 'acompanhamento', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-cenoura-manteiga', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-cenoura-manteiga', 'acompanhamento');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3025', 'rec-v3b-cenoura-manteiga', 'ing-cenoura', 3, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3026', 'rec-v3b-cenoura-manteiga', 'ing-manteiga', 1, 'colher de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3027', 'rec-v3b-cenoura-manteiga', 'ing-salsinha', 1, 'colher de sopa', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-brocolis-alho', 'Brócolis no alho', 'brocolis-alho', 'Brócolis salteado com alho, simples e versátil.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 15, 3, 'acompanhamento', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-brocolis-alho', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-brocolis-alho', 'acompanhamento');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-brocolis-alho', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3028', 'rec-v3b-brocolis-alho', 'ing-brocolis', 2, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3029', 'rec-v3b-brocolis-alho', 'ing-alho', 2, 'dentes', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3030', 'rec-v3b-brocolis-alho', 'ing-azeite', 1, 'colher de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-berinjela-frigideira', 'Berinjela dourada na frigideira', 'berinjela-frigideira', 'Fatias de berinjela douradas com ervas.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 20, 3, 'acompanhamento', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-berinjela-frigideira', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-berinjela-frigideira', 'acompanhamento');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3031', 'rec-v3b-berinjela-frigideira', 'ing-berinjela', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3032', 'rec-v3b-berinjela-frigideira', 'ing-azeite', 2, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3033', 'rec-v3b-berinjela-frigideira', 'ing-oregano', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-pure-mandioca', 'Purê de mandioca', 'pure-mandioca', 'Purê macio de mandioca com manteiga e leite.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 35, 4, 'acompanhamento', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-pure-mandioca', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-pure-mandioca', 'acompanhamento');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-pure-mandioca', 'caseira');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3034', 'rec-v3b-pure-mandioca', 'ing-mandioca', 600, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3035', 'rec-v3b-pure-mandioca', 'ing-leite', 0.5, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3036', 'rec-v3b-pure-mandioca', 'ing-manteiga', 1, 'colher de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-suco-laranja-cenoura', 'Suco de laranja com cenoura', 'suco-laranja-cenoura', 'Suco fresco de laranja com cenoura.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 8, 2, 'bebida', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-suco-laranja-cenoura', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-suco-laranja-cenoura', 'bebida');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-suco-laranja-cenoura', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3037', 'rec-v3b-suco-laranja-cenoura', 'ing-laranja', 3, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3038', 'rec-v3b-suco-laranja-cenoura', 'ing-cenoura', 0.5, 'unidade', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-vitamina-mamao', 'Vitamina de mamão', 'vitamina-mamao', 'Vitamina cremosa de mamão com leite.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 5, 2, 'bebida', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-vitamina-mamao', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-vitamina-mamao', 'bebida');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-vitamina-mamao', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3039', 'rec-v3b-vitamina-mamao', 'ing-mamao', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3040', 'rec-v3b-vitamina-mamao', 'ing-leite', 350, 'ml', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3041', 'rec-v3b-vitamina-mamao', 'ing-mel', 1, 'colher de sopa', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-vitamina-manga-iogurte', 'Vitamina de manga com iogurte', 'vitamina-manga-iogurte', 'Bebida cremosa com manga e iogurte natural.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 5, 2, 'bebida', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-vitamina-manga-iogurte', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-vitamina-manga-iogurte', 'bebida');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-vitamina-manga-iogurte', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3042', 'rec-v3b-vitamina-manga-iogurte', 'ing-manga', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3043', 'rec-v3b-vitamina-manga-iogurte', 'ing-iogurte', 170, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3044', 'rec-v3b-vitamina-manga-iogurte', 'ing-leite', 150, 'ml', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-limonada-mel', 'Limonada com mel', 'limonada-mel', 'Limonada simples com doçura suave de mel.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 5, 3, 'bebida', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-limonada-mel', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-limonada-mel', 'bebida');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-limonada-mel', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3045', 'rec-v3b-limonada-mel', 'ing-limao', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3046', 'rec-v3b-limonada-mel', 'ing-mel', 2, 'colheres de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-smoothie-morango-banana', 'Vitamina de morango e banana', 'smoothie-morango-banana', 'Bebida cremosa de frutas para qualquer hora.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 5, 2, 'bebida', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-smoothie-morango-banana', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-smoothie-morango-banana', 'bebida');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-smoothie-morango-banana', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3047', 'rec-v3b-smoothie-morango-banana', 'ing-morango', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3048', 'rec-v3b-smoothie-morango-banana', 'ing-banana', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3049', 'rec-v3b-smoothie-morango-banana', 'ing-leite', 250, 'ml', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-arroz-sardinha', 'Arroz com sardinha', 'arroz-sardinha', 'Arroz rápido com sardinha, tomate e cebola.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 25, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-arroz-sardinha', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-arroz-sardinha', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-arroz-sardinha', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3050', 'rec-v3b-arroz-sardinha', 'ing-arroz', 1.5, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3051', 'rec-v3b-arroz-sardinha', 'ing-sardinha', 1, 'lata', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3052', 'rec-v3b-arroz-sardinha', 'ing-tomate', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3053', 'rec-v3b-arroz-sardinha', 'ing-cebola', 0.5, 'unidade', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-frango-abobora', 'Frango com abóbora', 'frango-abobora', 'Frango de panela com cubos macios de abóbora.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 35, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-frango-abobora', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-frango-abobora', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-frango-abobora', 'caseira');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3054', 'rec-v3b-frango-abobora', 'ing-frango', 400, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3055', 'rec-v3b-frango-abobora', 'ing-abobora', 400, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3056', 'rec-v3b-frango-abobora', 'ing-cebola', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3057', 'rec-v3b-frango-abobora', 'ing-paprica', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-grao-bico-abobrinha', 'Grão-de-bico com abobrinha', 'grao-bico-abobrinha', 'Prato vegetariano simples com grão-de-bico e abobrinha.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 25, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-grao-bico-abobrinha', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-grao-bico-abobrinha', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-grao-bico-abobrinha', 'vegetariana');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3058', 'rec-v3b-grao-bico-abobrinha', 'ing-grao-bico', 2, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3059', 'rec-v3b-grao-bico-abobrinha', 'ing-abobrinha', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3060', 'rec-v3b-grao-bico-abobrinha', 'ing-tomate', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3061', 'rec-v3b-grao-bico-abobrinha', 'ing-cebola', 0.5, 'unidade', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-lentilha-cenoura', 'Lentilha com cenoura', 'lentilha-cenoura', 'Lentilha de panela com cenoura e temperos simples.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 30, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-lentilha-cenoura', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-lentilha-cenoura', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-lentilha-cenoura', 'vegetariana');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3062', 'rec-v3b-lentilha-cenoura', 'ing-lentilha', 1.5, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3063', 'rec-v3b-lentilha-cenoura', 'ing-cenoura', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3064', 'rec-v3b-lentilha-cenoura', 'ing-cebola', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3065', 'rec-v3b-lentilha-cenoura', 'ing-alho', 1, 'dente', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-macarrao-sardinha', 'Macarrão com sardinha', 'macarrao-sardinha', 'Massa econômica com sardinha e molho de tomate.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 20, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-macarrao-sardinha', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-macarrao-sardinha', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-macarrao-sardinha', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3066', 'rec-v3b-macarrao-sardinha', 'ing-macarrao', 250, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3067', 'rec-v3b-macarrao-sardinha', 'ing-sardinha', 1, 'lata', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3068', 'rec-v3b-macarrao-sardinha', 'ing-molho-tomate', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3069', 'rec-v3b-macarrao-sardinha', 'ing-oregano', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-frango-requeijao', 'Frango cremoso com requeijão', 'frango-requeijao', 'Frango cremoso com requeijão para servir com arroz.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 25, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-frango-requeijao', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-frango-requeijao', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-frango-requeijao', 'cremosa');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3070', 'rec-v3b-frango-requeijao', 'ing-frango', 400, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3071', 'rec-v3b-frango-requeijao', 'ing-requeijao', 3, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3072', 'rec-v3b-frango-requeijao', 'ing-cebola', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3073', 'rec-v3b-frango-requeijao', 'ing-milho', 0.5, 'xícara', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3b-arroz-abobora-couve', 'Arroz com abóbora e couve', 'arroz-abobora-couve', 'Arroz colorido com abóbora e couve.', '1. Prepare os ingredientes e corte o que for necessário.\n2. Misture, cozinhe ou asse até chegar ao ponto indicado.\n3. Finalize o tempero e sirva.', 30, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-arroz-abobora-couve', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-arroz-abobora-couve', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3b-arroz-abobora-couve', 'vegetariana');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3074', 'rec-v3b-arroz-abobora-couve', 'ing-arroz', 1.5, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3075', 'rec-v3b-arroz-abobora-couve', 'ing-abobora', 250, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3076', 'rec-v3b-arroz-abobora-couve', 'ing-couve', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3b-3077', 'rec-v3b-arroz-abobora-couve', 'ing-alho', 1, 'dente', 0);
