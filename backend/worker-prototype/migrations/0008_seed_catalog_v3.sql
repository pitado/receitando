-- Expansão v3 do catálogo próprio do Receitando
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-espinafre', 'Espinafre', 'espinafre', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-oregano', 'Orégano', 'oregano', 'temperos');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-abacate', 'Abacate', 'abacate', 'frutas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-farinha-milho', 'Farinha de milho', 'farinha de milho', 'grãos e farinhas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-molho-tomate', 'Molho de tomate', 'molho de tomate', 'mercearia');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-mostarda', 'Mostarda', 'mostarda', 'molhos');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-maionese', 'Maionese', 'maionese', 'molhos');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-atum', 'Atum', 'atum', 'proteínas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-sardinha', 'Sardinha', 'sardinha', 'proteínas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-lentilha', 'Lentilha', 'lentilha', 'grãos e leguminosas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-grao-bico', 'Grão-de-bico', 'grao-de-bico', 'grãos e leguminosas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-abobora', 'Abóbora', 'abobora', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-couve', 'Couve', 'couve', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-repolho', 'Repolho', 'repolho', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-pepino', 'Pepino', 'pepino', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-berinjela', 'Berinjela', 'berinjela', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-mandioca', 'Mandioca', 'mandioca', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-alface', 'Alface', 'alface', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-rucula', 'Rúcula', 'rucula', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-manga', 'Manga', 'manga', 'frutas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-mamao', 'Mamão', 'mamao', 'frutas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-maracuja', 'Maracujá', 'maracuja', 'frutas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-pera', 'Pera', 'pera', 'frutas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-uva', 'Uva', 'uva', 'frutas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-coco-ralado', 'Coco ralado', 'coco ralado', 'mercearia');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-leite-coco', 'Leite de coco', 'leite de coco', 'mercearia');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-mel', 'Mel', 'mel', 'mercearia');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-amido-milho', 'Amido de milho', 'amido de milho', 'grãos e farinhas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-fuba', 'Fubá', 'fuba', 'grãos e farinhas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-requeijao', 'Requeijão', 'requeijao', 'laticínios');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-ricota', 'Ricota', 'ricota', 'laticínios');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-amendoim', 'Amendoim', 'amendoim', 'oleaginosas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-granola', 'Granola', 'granola', 'grãos e cereais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-shoyu', 'Molho shoyu', 'molho shoyu', 'molhos');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-paprica', 'Páprica', 'paprica', 'temperos');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-cominho', 'Cominho', 'cominho', 'temperos');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-coentro', 'Coentro', 'coentro', 'temperos');

INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v3-001', 'ing-grao-bico', 'Grão de bico', 'grao de bico');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v3-002', 'ing-farinha-milho', 'Flocão', 'flocao');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v3-003', 'ing-molho-tomate', 'Passata', 'passata');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v3-004', 'ing-atum', 'Atum em lata', 'atum em lata');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v3-005', 'ing-sardinha', 'Sardinha em lata', 'sardinha em lata');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v3-006', 'ing-abobora', 'Moranga', 'moranga');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v3-007', 'ing-mandioca', 'Aipim', 'aipim');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v3-008', 'ing-mandioca', 'Macaxeira', 'macaxeira');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v3-009', 'ing-amido-milho', 'Maisena', 'maisena');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v3-010', 'ing-requeijao', 'Requeijão cremoso', 'requeijao cremoso');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v3-011', 'ing-oregano', 'Orégano seco', 'oregano seco');

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-crepioca-queijo', 'Crepioca de queijo', 'crepioca-queijo', 'Crepioca macia e rápida com queijo derretido.', '1. Misture o ovo com a tapioca.\n2. Despeje em frigideira aquecida.\n3. Adicione o queijo, dobre e aqueça até derreter.', 10, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-crepioca-queijo', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-crepioca-queijo', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-crepioca-queijo', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2001', 'rec-v3-crepioca-queijo', 'ing-ovo', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2002', 'rec-v3-crepioca-queijo', 'ing-tapioca', 3, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2003', 'rec-v3-crepioca-queijo', 'ing-queijo', 40, 'g', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-ovos-mexidos-cremosos', 'Ovos mexidos cremosos', 'ovos-mexidos-cremosos', 'Ovos macios feitos em fogo baixo.', '1. Bata os ovos.\n2. Derreta a manteiga em fogo baixo.\n3. Cozinhe mexendo devagar até ficar cremoso.', 8, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-ovos-mexidos-cremosos', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-ovos-mexidos-cremosos', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-ovos-mexidos-cremosos', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2004', 'rec-v3-ovos-mexidos-cremosos', 'ing-ovo', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2005', 'rec-v3-ovos-mexidos-cremosos', 'ing-manteiga', 1, 'colher de chá', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-iogurte-banana-aveia', 'Iogurte com banana e aveia', 'iogurte-banana-aveia', 'Tigela fria, simples e prática para manhãs corridas.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 5, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-iogurte-banana-aveia', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-iogurte-banana-aveia', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-iogurte-banana-aveia', 'sem-fogao');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2006', 'rec-v3-iogurte-banana-aveia', 'ing-iogurte', 170, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2007', 'rec-v3-iogurte-banana-aveia', 'ing-banana', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2008', 'rec-v3-iogurte-banana-aveia', 'ing-aveia', 2, 'colheres de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-mingau-maca-canela', 'Mingau de maçã e canela', 'mingau-maca-canela', 'Mingau de aveia com maçã macia e aroma de canela.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 12, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-mingau-maca-canela', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-mingau-maca-canela', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-mingau-maca-canela', 'quentinha');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2009', 'rec-v3-mingau-maca-canela', 'ing-aveia', 4, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2010', 'rec-v3-mingau-maca-canela', 'ing-leite', 250, 'ml', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2011', 'rec-v3-mingau-maca-canela', 'ing-maçã', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2012', 'rec-v3-mingau-maca-canela', 'ing-canela', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-panqueca-aveia-cacau', 'Panqueca de aveia com cacau', 'panqueca-aveia-cacau', 'Panqueca simples com sabor de chocolate.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 12, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-panqueca-aveia-cacau', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-panqueca-aveia-cacau', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-panqueca-aveia-cacau', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2013', 'rec-v3-panqueca-aveia-cacau', 'ing-ovo', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2014', 'rec-v3-panqueca-aveia-cacau', 'ing-banana', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2015', 'rec-v3-panqueca-aveia-cacau', 'ing-aveia', 3, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2016', 'rec-v3-panqueca-aveia-cacau', 'ing-cacau', 1, 'colher de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-tapioca-banana-canela', 'Tapioca de banana com canela', 'tapioca-banana-canela', 'Tapioca doce com recheio simples de banana.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 8, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-tapioca-banana-canela', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-tapioca-banana-canela', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-tapioca-banana-canela', 'doce');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2017', 'rec-v3-tapioca-banana-canela', 'ing-tapioca', 4, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2018', 'rec-v3-tapioca-banana-canela', 'ing-banana', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2019', 'rec-v3-tapioca-banana-canela', 'ing-canela', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-omelete-espinafre', 'Omelete de espinafre', 'omelete-espinafre', 'Omelete leve com folhas e poucos ingredientes.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 12, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-omelete-espinafre', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-omelete-espinafre', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-omelete-espinafre', 'proteica');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2020', 'rec-v3-omelete-espinafre', 'ing-ovo', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2021', 'rec-v3-omelete-espinafre', 'ing-espinafre', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2022', 'rec-v3-omelete-espinafre', 'ing-azeite', 1, 'colher de chá', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-pao-queijo-tomate', 'Pão quente com queijo e tomate', 'pao-queijo-tomate', 'Pão crocante com tomate, queijo e orégano.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 10, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pao-queijo-tomate', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pao-queijo-tomate', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pao-queijo-tomate', 'lanche');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2023', 'rec-v3-pao-queijo-tomate', 'ing-pao', 2, 'fatias', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2024', 'rec-v3-pao-queijo-tomate', 'ing-queijo', 50, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2025', 'rec-v3-pao-queijo-tomate', 'ing-tomate', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2026', 'rec-v3-pao-queijo-tomate', 'ing-oregano', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-vitamina-banana-aveia', 'Vitamina de banana e aveia', 'vitamina-banana-aveia', 'Bebida cremosa para um café da manhã rápido.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 5, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-vitamina-banana-aveia', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-vitamina-banana-aveia', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-vitamina-banana-aveia', 'bebida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2027', 'rec-v3-vitamina-banana-aveia', 'ing-banana', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2028', 'rec-v3-vitamina-banana-aveia', 'ing-leite', 250, 'ml', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2029', 'rec-v3-vitamina-banana-aveia', 'ing-aveia', 2, 'colheres de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-cuscuz-manteiga-ovo', 'Cuscuz com manteiga e ovo', 'cuscuz-manteiga-ovo', 'Cuscuz simples e caseiro com ovo.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 20, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-cuscuz-manteiga-ovo', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-cuscuz-manteiga-ovo', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-cuscuz-manteiga-ovo', 'caseira');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2030', 'rec-v3-cuscuz-manteiga-ovo', 'ing-farinha-milho', 0.5, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2031', 'rec-v3-cuscuz-manteiga-ovo', 'ing-manteiga', 1, 'colher de chá', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2032', 'rec-v3-cuscuz-manteiga-ovo', 'ing-ovo', 1, 'unidade', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-frango-molho-tomate', 'Frango ao molho de tomate', 'frango-molho-tomate', 'Frango em cubos com molho simples para o dia a dia.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 30, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-frango-molho-tomate', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-frango-molho-tomate', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-frango-molho-tomate', 'dia-a-dia');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2033', 'rec-v3-frango-molho-tomate', 'ing-frango', 400, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2034', 'rec-v3-frango-molho-tomate', 'ing-molho-tomate', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2035', 'rec-v3-frango-molho-tomate', 'ing-cebola', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2036', 'rec-v3-frango-molho-tomate', 'ing-alho', 2, 'dentes', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-frango-cremoso-milho', 'Frango cremoso com milho', 'frango-cremoso-milho', 'Frango com molho cremoso e milho.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 25, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-frango-cremoso-milho', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-frango-cremoso-milho', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-frango-cremoso-milho', 'cremosa');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2037', 'rec-v3-frango-cremoso-milho', 'ing-frango', 400, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2038', 'rec-v3-frango-cremoso-milho', 'ing-milho', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2039', 'rec-v3-frango-cremoso-milho', 'ing-creme-leite', 1, 'caixa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-frango-mostarda', 'Frango com molho de mostarda', 'frango-mostarda', 'Frango dourado com molho rápido de mostarda.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 25, 2, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-frango-mostarda', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-frango-mostarda', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-frango-mostarda', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2040', 'rec-v3-frango-mostarda', 'ing-frango', 350, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2041', 'rec-v3-frango-mostarda', 'ing-mostarda', 2, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2042', 'rec-v3-frango-mostarda', 'ing-creme-leite', 0.5, 'caixa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-carne-moida-batata', 'Carne moída com batata', 'carne-moida-batata', 'Carne moída de panela com batata macia.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 35, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-carne-moida-batata', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-carne-moida-batata', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-carne-moida-batata', 'caseira');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2043', 'rec-v3-carne-moida-batata', 'ing-carne-moida', 400, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2044', 'rec-v3-carne-moida-batata', 'ing-batata', 3, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2045', 'rec-v3-carne-moida-batata', 'ing-cebola', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2046', 'rec-v3-carne-moida-batata', 'ing-alho', 2, 'dentes', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-carne-moida-abobrinha', 'Carne moída com abobrinha', 'carne-moida-abobrinha', 'Carne moída com abobrinha para servir com arroz.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 25, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-carne-moida-abobrinha', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-carne-moida-abobrinha', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-carne-moida-abobrinha', 'dia-a-dia');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2047', 'rec-v3-carne-moida-abobrinha', 'ing-carne-moida', 350, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2048', 'rec-v3-carne-moida-abobrinha', 'ing-abobrinha', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2049', 'rec-v3-carne-moida-abobrinha', 'ing-cebola', 0.5, 'unidade', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-macarrao-atum-tomate', 'Macarrão com atum e tomate', 'macarrao-atum-tomate', 'Massa rápida com atum e molho de tomate.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 20, 2, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-macarrao-atum-tomate', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-macarrao-atum-tomate', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-macarrao-atum-tomate', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2050', 'rec-v3-macarrao-atum-tomate', 'ing-macarrao', 200, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2051', 'rec-v3-macarrao-atum-tomate', 'ing-atum', 1, 'lata', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2052', 'rec-v3-macarrao-atum-tomate', 'ing-molho-tomate', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2053', 'rec-v3-macarrao-atum-tomate', 'ing-cebola', 0.5, 'unidade', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-macarrao-cremoso-brocolis', 'Macarrão cremoso com brócolis', 'macarrao-cremoso-brocolis', 'Massa cremosa com brócolis e parmesão.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 25, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-macarrao-cremoso-brocolis', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-macarrao-cremoso-brocolis', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-macarrao-cremoso-brocolis', 'massa');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2054', 'rec-v3-macarrao-cremoso-brocolis', 'ing-macarrao', 250, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2055', 'rec-v3-macarrao-cremoso-brocolis', 'ing-brocolis', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2056', 'rec-v3-macarrao-cremoso-brocolis', 'ing-creme-leite', 1, 'caixa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2057', 'rec-v3-macarrao-cremoso-brocolis', 'ing-parmesao', 40, 'g', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-arroz-lentilha', 'Arroz com lentilha', 'arroz-lentilha', 'Arroz de panela com lentilha e cebola.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 35, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-arroz-lentilha', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-arroz-lentilha', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-arroz-lentilha', 'vegetariana');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2058', 'rec-v3-arroz-lentilha', 'ing-arroz', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2059', 'rec-v3-arroz-lentilha', 'ing-lentilha', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2060', 'rec-v3-arroz-lentilha', 'ing-cebola', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2061', 'rec-v3-arroz-lentilha', 'ing-alho', 1, 'dente', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-grao-bico-tomate', 'Grão-de-bico com tomate', 'grao-bico-tomate', 'Ensopado simples de grão-de-bico com tomate e ervas.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 30, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-grao-bico-tomate', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-grao-bico-tomate', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-grao-bico-tomate', 'vegetariana');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2062', 'rec-v3-grao-bico-tomate', 'ing-grao-bico', 2, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2063', 'rec-v3-grao-bico-tomate', 'ing-tomate', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2064', 'rec-v3-grao-bico-tomate', 'ing-cebola', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2065', 'rec-v3-grao-bico-tomate', 'ing-oregano', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-abobora-carne-moida', 'Abóbora com carne moída', 'abobora-carne-moida', 'Abóbora macia com carne moída bem temperada.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 35, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-abobora-carne-moida', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-abobora-carne-moida', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-abobora-carne-moida', 'caseira');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2066', 'rec-v3-abobora-carne-moida', 'ing-abobora', 500, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2067', 'rec-v3-abobora-carne-moida', 'ing-carne-moida', 350, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2068', 'rec-v3-abobora-carne-moida', 'ing-cebola', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2069', 'rec-v3-abobora-carne-moida', 'ing-alho', 2, 'dentes', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-berinjela-molho-queijo', 'Berinjela ao molho com queijo', 'berinjela-molho-queijo', 'Berinjela assada com molho de tomate e queijo.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 40, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-berinjela-molho-queijo', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-berinjela-molho-queijo', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-berinjela-molho-queijo', 'forno');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2070', 'rec-v3-berinjela-molho-queijo', 'ing-berinjela', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2071', 'rec-v3-berinjela-molho-queijo', 'ing-molho-tomate', 1.5, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2072', 'rec-v3-berinjela-molho-queijo', 'ing-queijo', 120, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2073', 'rec-v3-berinjela-molho-queijo', 'ing-oregano', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-arroz-frango-cenoura', 'Arroz de frango com cenoura', 'arroz-frango-cenoura', 'Arroz de uma panela só com frango e cenoura.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 35, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-arroz-frango-cenoura', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-arroz-frango-cenoura', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-arroz-frango-cenoura', 'uma-panela');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2074', 'rec-v3-arroz-frango-cenoura', 'ing-arroz', 1.5, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2075', 'rec-v3-arroz-frango-cenoura', 'ing-frango', 350, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2076', 'rec-v3-arroz-frango-cenoura', 'ing-cenoura', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2077', 'rec-v3-arroz-frango-cenoura', 'ing-cebola', 0.5, 'unidade', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-sardinha-molho-cebola', 'Sardinha ao molho com cebola', 'sardinha-molho-cebola', 'Sardinha rápida com tomate e cebola.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 20, 2, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-sardinha-molho-cebola', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-sardinha-molho-cebola', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-sardinha-molho-cebola', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2078', 'rec-v3-sardinha-molho-cebola', 'ing-sardinha', 2, 'latas', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2079', 'rec-v3-sardinha-molho-cebola', 'ing-tomate', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2080', 'rec-v3-sardinha-molho-cebola', 'ing-cebola', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2081', 'rec-v3-sardinha-molho-cebola', 'ing-azeite', 1, 'colher de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-pure-abobora', 'Purê de abóbora', 'pure-abobora', 'Purê cremoso e levemente adocicado.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 30, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pure-abobora', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pure-abobora', 'acompanhamento');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2082', 'rec-v3-pure-abobora', 'ing-abobora', 600, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2083', 'rec-v3-pure-abobora', 'ing-manteiga', 1, 'colher de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2084', 'rec-v3-pure-abobora', 'ing-leite', 0.5, 'xícara', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-mandioca-cremosa', 'Mandioca cremosa com queijo', 'mandioca-cremosa', 'Mandioca macia envolvida em creme e queijo.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 40, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-mandioca-cremosa', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-mandioca-cremosa', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-mandioca-cremosa', 'cremosa');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2085', 'rec-v3-mandioca-cremosa', 'ing-mandioca', 600, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2086', 'rec-v3-mandioca-cremosa', 'ing-creme-leite', 1, 'caixa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2087', 'rec-v3-mandioca-cremosa', 'ing-queijo', 100, 'g', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-frango-shoyu-legumes', 'Frango com shoyu e legumes', 'frango-shoyu-legumes', 'Frango salteado com legumes e molho shoyu.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 25, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-frango-shoyu-legumes', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-frango-shoyu-legumes', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-frango-shoyu-legumes', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2088', 'rec-v3-frango-shoyu-legumes', 'ing-frango', 350, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2089', 'rec-v3-frango-shoyu-legumes', 'ing-cenoura', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2090', 'rec-v3-frango-shoyu-legumes', 'ing-brocolis', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2091', 'rec-v3-frango-shoyu-legumes', 'ing-shoyu', 3, 'colheres de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-arroz-grao-bico-cenoura', 'Arroz com grão-de-bico e cenoura', 'arroz-grao-bico-cenoura', 'Arroz colorido com grão-de-bico e cenoura.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 30, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-arroz-grao-bico-cenoura', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-arroz-grao-bico-cenoura', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-arroz-grao-bico-cenoura', 'vegetariana');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2092', 'rec-v3-arroz-grao-bico-cenoura', 'ing-arroz', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2093', 'rec-v3-arroz-grao-bico-cenoura', 'ing-grao-bico', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2094', 'rec-v3-arroz-grao-bico-cenoura', 'ing-cenoura', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2095', 'rec-v3-arroz-grao-bico-cenoura', 'ing-cebola', 0.5, 'unidade', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-omelete-forno-legumes', 'Omelete de forno com legumes', 'omelete-forno-legumes', 'Omelete assada com milho, tomate e cenoura.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 35, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-omelete-forno-legumes', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-omelete-forno-legumes', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-omelete-forno-legumes', 'forno');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2096', 'rec-v3-omelete-forno-legumes', 'ing-ovo', 5, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2097', 'rec-v3-omelete-forno-legumes', 'ing-milho', 0.5, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2098', 'rec-v3-omelete-forno-legumes', 'ing-tomate', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2099', 'rec-v3-omelete-forno-legumes', 'ing-cenoura', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2100', 'rec-v3-omelete-forno-legumes', 'ing-queijo', 80, 'g', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-macarrao-berinjela-tomate', 'Macarrão com berinjela e tomate', 'macarrao-berinjela-tomate', 'Massa com cubos de berinjela e molho de tomate.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 30, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-macarrao-berinjela-tomate', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-macarrao-berinjela-tomate', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-macarrao-berinjela-tomate', 'vegetariana');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2101', 'rec-v3-macarrao-berinjela-tomate', 'ing-macarrao', 250, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2102', 'rec-v3-macarrao-berinjela-tomate', 'ing-berinjela', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2103', 'rec-v3-macarrao-berinjela-tomate', 'ing-molho-tomate', 1.5, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2104', 'rec-v3-macarrao-berinjela-tomate', 'ing-alho', 2, 'dentes', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-lentilha-abobora', 'Lentilha com abóbora', 'lentilha-abobora', 'Ensopado de lentilha com cubos macios de abóbora.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 35, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-lentilha-abobora', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-lentilha-abobora', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-lentilha-abobora', 'vegetariana');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2105', 'rec-v3-lentilha-abobora', 'ing-lentilha', 1.5, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2106', 'rec-v3-lentilha-abobora', 'ing-abobora', 300, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2107', 'rec-v3-lentilha-abobora', 'ing-cebola', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2108', 'rec-v3-lentilha-abobora', 'ing-cominho', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-sanduiche-atum', 'Sanduíche de atum', 'sanduiche-atum', 'Sanduíche frio e cremoso com atum.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 10, 2, 'lanche', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-sanduiche-atum', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-sanduiche-atum', 'lanche');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-sanduiche-atum', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2109', 'rec-v3-sanduiche-atum', 'ing-pao', 4, 'fatias', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2110', 'rec-v3-sanduiche-atum', 'ing-atum', 1, 'lata', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2111', 'rec-v3-sanduiche-atum', 'ing-maionese', 2, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2112', 'rec-v3-sanduiche-atum', 'ing-tomate', 1, 'unidade', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-pao-requeijao-tomate', 'Pão com requeijão e tomate', 'pao-requeijao-tomate', 'Lanche quente e cremoso com tomate.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 10, 1, 'lanche', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pao-requeijao-tomate', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pao-requeijao-tomate', 'lanche');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pao-requeijao-tomate', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2113', 'rec-v3-pao-requeijao-tomate', 'ing-pao', 2, 'fatias', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2114', 'rec-v3-pao-requeijao-tomate', 'ing-requeijao', 2, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2115', 'rec-v3-pao-requeijao-tomate', 'ing-tomate', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2116', 'rec-v3-pao-requeijao-tomate', 'ing-oregano', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-bolinho-arroz-frigideira', 'Bolinho de arroz de frigideira', 'bolinho-arroz-frigideira', 'Forma simples de reaproveitar arroz cozido.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 20, 3, 'lanche', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-bolinho-arroz-frigideira', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-bolinho-arroz-frigideira', 'lanche');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-bolinho-arroz-frigideira', 'aproveitamento');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2117', 'rec-v3-bolinho-arroz-frigideira', 'ing-arroz', 2, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2118', 'rec-v3-bolinho-arroz-frigideira', 'ing-ovo', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2119', 'rec-v3-bolinho-arroz-frigideira', 'ing-queijo', 50, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2120', 'rec-v3-bolinho-arroz-frigideira', 'ing-farinha-trigo', 3, 'colheres de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-tapioca-frango-requeijao', 'Tapioca de frango com requeijão', 'tapioca-frango-requeijao', 'Tapioca recheada com frango e requeijão.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 15, 1, 'lanche', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-tapioca-frango-requeijao', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-tapioca-frango-requeijao', 'lanche');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-tapioca-frango-requeijao', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2121', 'rec-v3-tapioca-frango-requeijao', 'ing-tapioca', 4, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2122', 'rec-v3-tapioca-frango-requeijao', 'ing-frango', 100, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2123', 'rec-v3-tapioca-frango-requeijao', 'ing-requeijao', 1, 'colher de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-pate-grao-bico', 'Patê de grão-de-bico', 'pate-grao-bico', 'Patê cremoso para pão ou torradas.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 10, 4, 'lanche', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pate-grao-bico', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pate-grao-bico', 'lanche');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pate-grao-bico', 'sem-fogao');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2124', 'rec-v3-pate-grao-bico', 'ing-grao-bico', 1.5, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2125', 'rec-v3-pate-grao-bico', 'ing-limao', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2126', 'rec-v3-pate-grao-bico', 'ing-azeite', 2, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2127', 'rec-v3-pate-grao-bico', 'ing-alho', 1, 'dente', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-pao-pizza-frigideira', 'Pão pizza de frigideira', 'pao-pizza-frigideira', 'Pão com molho, queijo e tomate feito rapidamente.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 12, 2, 'lanche', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pao-pizza-frigideira', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pao-pizza-frigideira', 'lanche');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pao-pizza-frigideira', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2128', 'rec-v3-pao-pizza-frigideira', 'ing-pao', 4, 'fatias', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2129', 'rec-v3-pao-pizza-frigideira', 'ing-molho-tomate', 4, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2130', 'rec-v3-pao-pizza-frigideira', 'ing-queijo', 100, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2131', 'rec-v3-pao-pizza-frigideira', 'ing-tomate', 1, 'unidade', 1);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2132', 'rec-v3-pao-pizza-frigideira', 'ing-oregano', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-creme-abacate-limao', 'Creme de abacate com limão', 'creme-abacate-limao', 'Creme gelado de abacate com toque cítrico.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 5, 2, 'lanche', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-creme-abacate-limao', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-creme-abacate-limao', 'lanche');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-creme-abacate-limao', 'sem-fogao');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2133', 'rec-v3-creme-abacate-limao', 'ing-abacate', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2134', 'rec-v3-creme-abacate-limao', 'ing-limao', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2135', 'rec-v3-creme-abacate-limao', 'ing-mel', 1, 'colher de sopa', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-iogurte-mamao-granola', 'Iogurte com mamão e granola', 'iogurte-mamao-granola', 'Lanche frio, crocante e rápido.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 5, 1, 'lanche', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-iogurte-mamao-granola', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-iogurte-mamao-granola', 'lanche');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-iogurte-mamao-granola', 'sem-fogao');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2136', 'rec-v3-iogurte-mamao-granola', 'ing-iogurte', 170, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2137', 'rec-v3-iogurte-mamao-granola', 'ing-mamao', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2138', 'rec-v3-iogurte-mamao-granola', 'ing-granola', 3, 'colheres de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-ricota-tomate-torrada', 'Torrada de ricota e tomate', 'ricota-tomate-torrada', 'Torrada leve com ricota temperada.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 10, 2, 'lanche', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-ricota-tomate-torrada', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-ricota-tomate-torrada', 'lanche');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-ricota-tomate-torrada', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2139', 'rec-v3-ricota-tomate-torrada', 'ing-pao', 4, 'fatias', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2140', 'rec-v3-ricota-tomate-torrada', 'ing-ricota', 100, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2141', 'rec-v3-ricota-tomate-torrada', 'ing-tomate', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2142', 'rec-v3-ricota-tomate-torrada', 'ing-oregano', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-bolo-caneca-banana', 'Bolo de caneca de banana', 'bolo-caneca-banana', 'Bolo individual e rápido de banana.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 8, 1, 'lanche', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-bolo-caneca-banana', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-bolo-caneca-banana', 'lanche');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-bolo-caneca-banana', 'doce');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-bolo-caneca-banana', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2143', 'rec-v3-bolo-caneca-banana', 'ing-banana', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2144', 'rec-v3-bolo-caneca-banana', 'ing-ovo', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2145', 'rec-v3-bolo-caneca-banana', 'ing-aveia', 3, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2146', 'rec-v3-bolo-caneca-banana', 'ing-canela', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-brigadeiro-cacau', 'Brigadeiro de cacau', 'brigadeiro-cacau', 'Brigadeiro clássico com cacau em pó.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 20, 12, 'sobremesa', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-brigadeiro-cacau', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-brigadeiro-cacau', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-brigadeiro-cacau', 'doce');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2147', 'rec-v3-brigadeiro-cacau', 'ing-leite-condensado', 1, 'lata', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2148', 'rec-v3-brigadeiro-cacau', 'ing-cacau', 3, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2149', 'rec-v3-brigadeiro-cacau', 'ing-manteiga', 1, 'colher de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-mousse-maracuja', 'Mousse de maracujá', 'mousse-maracuja', 'Sobremesa cremosa com sabor marcante de maracujá.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 10, 6, 'sobremesa', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-mousse-maracuja', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-mousse-maracuja', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-mousse-maracuja', 'sem-forno');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2150', 'rec-v3-mousse-maracuja', 'ing-leite-condensado', 1, 'lata', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2151', 'rec-v3-mousse-maracuja', 'ing-creme-leite', 1, 'caixa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2152', 'rec-v3-mousse-maracuja', 'ing-maracuja', 2, 'unidades', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-creme-limao', 'Creme de limão', 'creme-limao', 'Creme gelado de limão com poucos ingredientes.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 10, 4, 'sobremesa', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-creme-limao', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-creme-limao', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-creme-limao', 'sem-forno');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2153', 'rec-v3-creme-limao', 'ing-leite-condensado', 1, 'lata', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2154', 'rec-v3-creme-limao', 'ing-creme-leite', 1, 'caixa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2155', 'rec-v3-creme-limao', 'ing-limao', 2, 'unidades', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-banana-caramelizada-canela', 'Banana caramelizada com canela', 'banana-caramelizada-canela', 'Banana dourada na frigideira com açúcar e canela.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 10, 2, 'sobremesa', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-banana-caramelizada-canela', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-banana-caramelizada-canela', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-banana-caramelizada-canela', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2156', 'rec-v3-banana-caramelizada-canela', 'ing-banana', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2157', 'rec-v3-banana-caramelizada-canela', 'ing-acucar', 2, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2158', 'rec-v3-banana-caramelizada-canela', 'ing-canela', 1, 'pitada', 1);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2159', 'rec-v3-banana-caramelizada-canela', 'ing-manteiga', 1, 'colher de chá', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-maca-assada-canela', 'Maçã assada com canela', 'maca-assada-canela', 'Maçã macia assada com canela e mel.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 30, 2, 'sobremesa', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-maca-assada-canela', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-maca-assada-canela', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-maca-assada-canela', 'forno');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2160', 'rec-v3-maca-assada-canela', 'ing-maçã', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2161', 'rec-v3-maca-assada-canela', 'ing-canela', 1, 'pitada', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2162', 'rec-v3-maca-assada-canela', 'ing-mel', 1, 'colher de sopa', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-cocada-cremosa', 'Cocada cremosa', 'cocada-cremosa', 'Doce de coco simples e cremoso.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 25, 8, 'sobremesa', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-cocada-cremosa', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-cocada-cremosa', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-cocada-cremosa', 'doce');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2163', 'rec-v3-cocada-cremosa', 'ing-coco-ralado', 200, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2164', 'rec-v3-cocada-cremosa', 'ing-leite-condensado', 1, 'lata', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2165', 'rec-v3-cocada-cremosa', 'ing-manteiga', 1, 'colher de chá', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-pudim-pao', 'Pudim de pão simples', 'pudim-pao', 'Sobremesa para aproveitar pão com textura macia.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 55, 8, 'sobremesa', 'MEDIA', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pudim-pao', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pudim-pao', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-pudim-pao', 'aproveitamento');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2166', 'rec-v3-pudim-pao', 'ing-pao', 4, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2167', 'rec-v3-pudim-pao', 'ing-leite', 500, 'ml', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2168', 'rec-v3-pudim-pao', 'ing-ovo', 3, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2169', 'rec-v3-pudim-pao', 'ing-acucar', 1, 'xícara', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-bolo-fuba', 'Bolo simples de fubá', 'bolo-fuba', 'Bolo caseiro de fubá para café da tarde.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 45, 10, 'sobremesa', 'MEDIA', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-bolo-fuba', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-bolo-fuba', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-bolo-fuba', 'bolo');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2170', 'rec-v3-bolo-fuba', 'ing-fuba', 2, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2171', 'rec-v3-bolo-fuba', 'ing-farinha-trigo', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2172', 'rec-v3-bolo-fuba', 'ing-ovo', 3, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2173', 'rec-v3-bolo-fuba', 'ing-leite', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2174', 'rec-v3-bolo-fuba', 'ing-acucar', 1.5, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2175', 'rec-v3-bolo-fuba', 'ing-fermento', 1, 'colher de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-creme-manga-iogurte', 'Creme de manga com iogurte', 'creme-manga-iogurte', 'Sobremesa gelada e frutada com dois ingredientes principais.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 5, 3, 'sobremesa', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-creme-manga-iogurte', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-creme-manga-iogurte', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-creme-manga-iogurte', 'sem-fogao');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2176', 'rec-v3-creme-manga-iogurte', 'ing-manga', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2177', 'rec-v3-creme-manga-iogurte', 'ing-iogurte', 340, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2178', 'rec-v3-creme-manga-iogurte', 'ing-mel', 1, 'colher de sopa', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-v3-uva-chocolate', 'Uvas com chocolate', 'uva-chocolate', 'Uvas envolvidas em chocolate para uma sobremesa simples.', '1. Separe e prepare os ingredientes.\n2. Cozinhe ou misture conforme a receita até atingir o ponto desejado.\n3. Ajuste o tempero e sirva.', 20, 4, 'sobremesa', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-uva-chocolate', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-uva-chocolate', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-v3-uva-chocolate', 'doce');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2179', 'rec-v3-uva-chocolate', 'ing-uva', 300, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v3-2180', 'rec-v3-uva-chocolate', 'ing-chocolate', 150, 'g', 0);
