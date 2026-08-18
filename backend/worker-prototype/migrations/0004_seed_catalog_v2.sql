-- Expansão do catálogo próprio do Receitando

INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-frango', 'Peito de frango', 'peito de frango', 'proteínas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-carne-moida', 'Carne moída', 'carne moida', 'proteínas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-feijao', 'Feijão', 'feijao', 'grãos e leguminosas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-aveia', 'Aveia', 'aveia', 'grãos e farinhas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-cacau', 'Cacau em pó', 'cacau em po', 'mercearia');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-canela', 'Canela', 'canela', 'temperos');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-maçã', 'Maçã', 'maca', 'frutas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-laranja', 'Laranja', 'laranja', 'frutas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-limao', 'Limão', 'limao', 'frutas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-morango', 'Morango', 'morango', 'frutas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-abobrinha', 'Abobrinha', 'abobrinha', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-brocolis', 'Brócolis', 'brocolis', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-pimentao', 'Pimentão', 'pimentao', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-milho', 'Milho', 'milho', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-ervilha', 'Ervilha', 'ervilha', 'vegetais');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-creme-leite', 'Creme de leite', 'creme de leite', 'laticínios');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-iogurte', 'Iogurte natural', 'iogurte natural', 'laticínios');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-parmesao', 'Queijo parmesão', 'queijo parmesao', 'laticínios');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-pao', 'Pão', 'pao', 'padaria');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-tapioca', 'Goma de tapioca', 'goma de tapioca', 'grãos e farinhas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-cafe', 'Café', 'cafe', 'bebidas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-chocolate', 'Chocolate', 'chocolate', 'mercearia');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-leite-condensado', 'Leite condensado', 'leite condensado', 'mercearia');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-vinagre', 'Vinagre', 'vinagre', 'temperos');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-azeite', 'Azeite', 'azeite', 'óleos e gorduras');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-salsinha', 'Salsinha', 'salsinha', 'temperos');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-cebolinha', 'Cebolinha', 'cebolinha', 'temperos');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-pimenta-reino', 'Pimenta-do-reino', 'pimenta-do-reino', 'temperos');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-presunto', 'Presunto', 'presunto', 'proteínas');
INSERT OR IGNORE INTO ingredients (id, name, normalized_name, category) VALUES ('ing-batata-doce', 'Batata-doce', 'batata-doce', 'vegetais');

INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-001', 'ing-frango', 'Frango', 'frango');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-002', 'ing-frango', 'Peito de frango', 'peito de frango');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-003', 'ing-carne-moida', 'Carne moída', 'carne moida');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-004', 'ing-feijao', 'Feijão carioca', 'feijao carioca');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-005', 'ing-aveia', 'Flocos de aveia', 'flocos de aveia');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-006', 'ing-cacau', 'Chocolate em pó', 'chocolate em po');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-007', 'ing-maçã', 'Maca', 'maca');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-008', 'ing-limao', 'Suco de limão', 'suco de limao');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-009', 'ing-creme-leite', 'Nata culinária', 'nata culinaria');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-010', 'ing-parmesao', 'Queijo ralado', 'queijo ralado');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-011', 'ing-tapioca', 'Tapioca', 'tapioca');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-012', 'ing-azeite', 'Azeite de oliva', 'azeite de oliva');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-013', 'ing-salsinha', 'Cheiro-verde', 'cheiro verde');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-014', 'ing-cebolinha', 'Cebolinha verde', 'cebolinha verde');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-015', 'ing-pimenta-reino', 'Pimenta do reino', 'pimenta do reino');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-016', 'ing-pao', 'Pão de forma', 'pao de forma');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-017', 'ing-batata-doce', 'Batata doce', 'batata doce');
INSERT OR IGNORE INTO ingredient_aliases (id, ingredient_id, alias, normalized_alias) VALUES ('alias-v2-018', 'ing-iogurte', 'Iogurte', 'iogurte');

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-frango-grelhado', 'Frango grelhado com alho', 'frango-grelhado', 'Frango dourado por fora e suculento por dentro, temperado de forma simples.', '1. Tempere o frango com alho, sal e pimenta.\n2. Aqueça uma frigideira com azeite.\n3. Grelhe dos dois lados até cozinhar por completo.', 25, 2, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-frango-grelhado', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-frango-grelhado', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1001', 'rec-frango-grelhado', 'ing-frango', 300, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1002', 'rec-frango-grelhado', 'ing-alho', 2, 'dentes', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1003', 'rec-frango-grelhado', 'ing-azeite', 1, 'colher de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1004', 'rec-frango-grelhado', 'ing-sal', 1, 'pitada', 1);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1005', 'rec-frango-grelhado', 'ing-pimenta-reino', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-arroz-feijao', 'Arroz com feijão rápido', 'arroz-feijao', 'Uma combinação caseira para aproveitar arroz e feijão em uma refeição simples.', '1. Refogue cebola e alho.\n2. Junte o feijão cozido e aqueça.\n3. Sirva com o arroz quente e finalize com cheiro-verde.', 20, 2, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-arroz-feijao', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-arroz-feijao', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-arroz-feijao', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1006', 'rec-arroz-feijao', 'ing-arroz', 2, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1007', 'rec-arroz-feijao', 'ing-feijao', 2, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1008', 'rec-arroz-feijao', 'ing-cebola', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1009', 'rec-arroz-feijao', 'ing-alho', 1, 'dente', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1010', 'rec-arroz-feijao', 'ing-salsinha', 1, 'colher de sopa', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-mingau-aveia-banana', 'Mingau de aveia com banana', 'mingau-aveia-banana', 'Café da manhã cremoso e rápido, naturalmente adocicado pela banana.', '1. Aqueça o leite com a aveia.\n2. Mexa até engrossar.\n3. Junte a banana amassada e finalize com canela.', 10, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-mingau-aveia-banana', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-mingau-aveia-banana', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-mingau-aveia-banana', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1011', 'rec-mingau-aveia-banana', 'ing-aveia', 4, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1012', 'rec-mingau-aveia-banana', 'ing-leite', 250, 'ml', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1013', 'rec-mingau-aveia-banana', 'ing-banana', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1014', 'rec-mingau-aveia-banana', 'ing-canela', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-tapioca-queijo', 'Tapioca com queijo', 'tapioca-queijo', 'Tapioca macia com queijo derretido, pronta em poucos minutos.', '1. Espalhe a goma em frigideira quente.\n2. Quando firmar, adicione o queijo.\n3. Dobre e aqueça até derreter.', 8, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-tapioca-queijo', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-tapioca-queijo', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-tapioca-queijo', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1015', 'rec-tapioca-queijo', 'ing-tapioca', 4, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1016', 'rec-tapioca-queijo', 'ing-queijo', 50, 'g', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-ovos-mexidos', 'Ovos mexidos cremosos', 'ovos-mexidos', 'Ovos macios e cremosos para um café da manhã simples.', '1. Bata os ovos com uma pitada de sal.\n2. Derreta a manteiga em fogo baixo.\n3. Cozinhe mexendo devagar até ficar cremoso.', 8, 1, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-ovos-mexidos', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-ovos-mexidos', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-ovos-mexidos', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1017', 'rec-ovos-mexidos', 'ing-ovo', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1018', 'rec-ovos-mexidos', 'ing-manteiga', 1, 'colher de chá', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1019', 'rec-ovos-mexidos', 'ing-sal', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-macarrao-tomate', 'Macarrão ao molho de tomate rápido', 'macarrao-tomate', 'Massa simples com molho caseiro de tomate e alho.', '1. Cozinhe o macarrão.\n2. Refogue alho e cebola no azeite.\n3. Junte o tomate picado e cozinhe até formar molho.\n4. Misture com a massa.', 25, 2, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-macarrao-tomate', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-macarrao-tomate', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1020', 'rec-macarrao-tomate', 'ing-macarrao', 200, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1021', 'rec-macarrao-tomate', 'ing-tomate', 3, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1022', 'rec-macarrao-tomate', 'ing-alho', 2, 'dentes', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1023', 'rec-macarrao-tomate', 'ing-cebola', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1024', 'rec-macarrao-tomate', 'ing-azeite', 1, 'colher de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1025', 'rec-macarrao-tomate', 'ing-sal', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-abobrinha-refogada', 'Abobrinha refogada', 'abobrinha-refogada', 'Acompanhamento leve, rápido e bem temperado.', '1. Corte a abobrinha em cubos.\n2. Refogue alho e cebola no azeite.\n3. Junte a abobrinha e cozinhe até ficar macia, mas ainda firme.', 15, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-abobrinha-refogada', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-abobrinha-refogada', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-abobrinha-refogada', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1026', 'rec-abobrinha-refogada', 'ing-abobrinha', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1027', 'rec-abobrinha-refogada', 'ing-alho', 1, 'dente', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1028', 'rec-abobrinha-refogada', 'ing-cebola', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1029', 'rec-abobrinha-refogada', 'ing-azeite', 1, 'colher de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1030', 'rec-abobrinha-refogada', 'ing-sal', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-brocolis-alho', 'Brócolis com alho', 'brocolis-alho', 'Brócolis verde e macio com alho dourado.', '1. Cozinhe o brócolis rapidamente no vapor ou em água.\n2. Doure o alho no azeite.\n3. Misture o brócolis e ajuste o sal.', 15, 2, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-brocolis-alho', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-brocolis-alho', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-brocolis-alho', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1031', 'rec-brocolis-alho', 'ing-brocolis', 1, 'maço', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1032', 'rec-brocolis-alho', 'ing-alho', 2, 'dentes', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1033', 'rec-brocolis-alho', 'ing-azeite', 1, 'colher de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1034', 'rec-brocolis-alho', 'ing-sal', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-carne-moida-legumes', 'Carne moída com legumes', 'carne-moida-legumes', 'Carne moída úmida com legumes para servir com arroz ou purê.', '1. Refogue cebola e alho.\n2. Doure a carne moída.\n3. Acrescente cenoura e tomate.\n4. Cozinhe até os legumes amaciarem.', 30, 4, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-carne-moida-legumes', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-carne-moida-legumes', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1035', 'rec-carne-moida-legumes', 'ing-carne-moida', 400, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1036', 'rec-carne-moida-legumes', 'ing-cebola', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1037', 'rec-carne-moida-legumes', 'ing-alho', 2, 'dentes', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1038', 'rec-carne-moida-legumes', 'ing-cenoura', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1039', 'rec-carne-moida-legumes', 'ing-tomate', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1040', 'rec-carne-moida-legumes', 'ing-sal', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-pure-batata-doce', 'Purê de batata-doce', 'pure-batata-doce', 'Purê suave e levemente adocicado.', '1. Cozinhe a batata-doce até amaciar.\n2. Amasse.\n3. Misture leite e manteiga em fogo baixo até ficar cremoso.', 30, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-pure-batata-doce', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-pure-batata-doce', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1041', 'rec-pure-batata-doce', 'ing-batata-doce', 500, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1042', 'rec-pure-batata-doce', 'ing-leite', 100, 'ml', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1043', 'rec-pure-batata-doce', 'ing-manteiga', 1, 'colher de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1044', 'rec-pure-batata-doce', 'ing-sal', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-salada-tomate-milho', 'Salada de tomate e milho', 'salada-tomate-milho', 'Salada fresca e colorida para acompanhar refeições.', '1. Corte os tomates.\n2. Misture com milho e cebola.\n3. Tempere com azeite, vinagre e sal.', 10, 3, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-salada-tomate-milho', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-salada-tomate-milho', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-salada-tomate-milho', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1045', 'rec-salada-tomate-milho', 'ing-tomate', 3, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1046', 'rec-salada-tomate-milho', 'ing-milho', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1047', 'rec-salada-tomate-milho', 'ing-cebola', 0.5, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1048', 'rec-salada-tomate-milho', 'ing-azeite', 1, 'colher de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1049', 'rec-salada-tomate-milho', 'ing-vinagre', 1, 'colher de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1050', 'rec-salada-tomate-milho', 'ing-sal', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-bolo-chocolate-simples', 'Bolo de chocolate simples', 'bolo-chocolate-simples', 'Bolo caseiro de chocolate com massa macia e preparo direto.', '1. Misture ovos, leite e açúcar.\n2. Incorpore farinha e cacau.\n3. Acrescente fermento por último.\n4. Asse a 180 °C até firmar.', 45, 8, 'sobremesa', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-bolo-chocolate-simples', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-bolo-chocolate-simples', 'sobremesa');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1051', 'rec-bolo-chocolate-simples', 'ing-ovo', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1052', 'rec-bolo-chocolate-simples', 'ing-leite', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1053', 'rec-bolo-chocolate-simples', 'ing-acucar', 1, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1054', 'rec-bolo-chocolate-simples', 'ing-farinha-trigo', 2, 'xícaras', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1055', 'rec-bolo-chocolate-simples', 'ing-cacau', 0.5, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1056', 'rec-bolo-chocolate-simples', 'ing-fermento', 1, 'colher de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-panqueca-aveia', 'Panqueca de aveia', 'panqueca-aveia', 'Panqueca rápida com aveia, boa para café da manhã ou lanche.', '1. Misture ovo, leite e aveia.\n2. Deixe descansar por dois minutos.\n3. Doure pequenas porções em frigideira untada.', 12, 2, 'cafe-da-manha', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-panqueca-aveia', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-panqueca-aveia', 'cafe-da-manha');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-panqueca-aveia', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1057', 'rec-panqueca-aveia', 'ing-ovo', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1058', 'rec-panqueca-aveia', 'ing-leite', 100, 'ml', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1059', 'rec-panqueca-aveia', 'ing-aveia', 5, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1060', 'rec-panqueca-aveia', 'ing-manteiga', 1, 'colher de chá', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-iogurte-morango', 'Iogurte com morango e aveia', 'iogurte-morango', 'Lanche frio, simples e rápido.', '1. Corte os morangos.\n2. Misture com o iogurte.\n3. Finalize com aveia.', 5, 1, 'lanche', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-iogurte-morango', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-iogurte-morango', 'lanche');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-iogurte-morango', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1061', 'rec-iogurte-morango', 'ing-iogurte', 170, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1062', 'rec-iogurte-morango', 'ing-morango', 6, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1063', 'rec-iogurte-morango', 'ing-aveia', 2, 'colheres de sopa', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-brigadeiro-colher', 'Brigadeiro de colher', 'brigadeiro-colher', 'Doce cremoso de chocolate para servir ainda macio.', '1. Misture leite condensado, cacau e manteiga.\n2. Cozinhe em fogo baixo mexendo sempre.\n3. Pare quando engrossar, antes do ponto de enrolar.', 15, 4, 'sobremesa', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-brigadeiro-colher', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-brigadeiro-colher', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-brigadeiro-colher', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1064', 'rec-brigadeiro-colher', 'ing-leite-condensado', 1, 'lata', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1065', 'rec-brigadeiro-colher', 'ing-cacau', 3, 'colheres de sopa', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1066', 'rec-brigadeiro-colher', 'ing-manteiga', 1, 'colher de sopa', 0);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-maca-canela', 'Maçã quente com canela', 'maca-canela', 'Sobremesa simples com maçã macia e aroma de canela.', '1. Corte a maçã em cubos.\n2. Leve ao fogo baixo com um pouco de água.\n3. Quando amaciar, finalize com canela.', 12, 2, 'sobremesa', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-maca-canela', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-maca-canela', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-maca-canela', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1067', 'rec-maca-canela', 'ing-maçã', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1068', 'rec-maca-canela', 'ing-canela', 1, 'colher de chá', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1069', 'rec-maca-canela', 'ing-acucar', 1, 'colher de sopa', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-sanduiche-quente', 'Sanduíche quente de queijo e presunto', 'sanduiche-quente', 'Lanche tostado com recheio clássico.', '1. Monte o pão com queijo e presunto.\n2. Passe uma camada fina de manteiga por fora.\n3. Doure em frigideira dos dois lados.', 10, 1, 'lanche', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-sanduiche-quente', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-sanduiche-quente', 'lanche');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-sanduiche-quente', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1070', 'rec-sanduiche-quente', 'ing-pao', 2, 'fatias', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1071', 'rec-sanduiche-quente', 'ing-queijo', 2, 'fatias', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1072', 'rec-sanduiche-quente', 'ing-presunto', 2, 'fatias', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1073', 'rec-sanduiche-quente', 'ing-manteiga', 1, 'colher de chá', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-omelete-brocolis', 'Omelete de brócolis', 'omelete-brocolis', 'Omelete reforçada com brócolis e queijo.', '1. Bata os ovos.\n2. Misture o brócolis picado.\n3. Cozinhe em frigideira e adicione queijo antes de dobrar.', 12, 1, 'almoco-jantar', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-omelete-brocolis', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-omelete-brocolis', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-omelete-brocolis', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1074', 'rec-omelete-brocolis', 'ing-ovo', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1075', 'rec-omelete-brocolis', 'ing-brocolis', 0.5, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1076', 'rec-omelete-brocolis', 'ing-queijo', 40, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1077', 'rec-omelete-brocolis', 'ing-sal', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-arroz-frango', 'Arroz com frango de uma panela', 'arroz-frango', 'Refeição prática com arroz, frango e legumes em uma panela só.', '1. Doure o frango com alho e cebola.\n2. Acrescente arroz, cenoura e tomate.\n3. Cubra com água e cozinhe em fogo baixo até secar.', 40, 4, 'almoco-jantar', 'MEDIA', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-arroz-frango', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-arroz-frango', 'almoco-jantar');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1078', 'rec-arroz-frango', 'ing-frango', 400, 'g', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1079', 'rec-arroz-frango', 'ing-arroz', 1.5, 'xícara', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1080', 'rec-arroz-frango', 'ing-cebola', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1081', 'rec-arroz-frango', 'ing-alho', 2, 'dentes', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1082', 'rec-arroz-frango', 'ing-cenoura', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1083', 'rec-arroz-frango', 'ing-tomate', 1, 'unidade', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1084', 'rec-arroz-frango', 'ing-sal', 1, 'pitada', 1);

INSERT OR IGNORE INTO recipes (id, title, slug, description, instructions, prep_minutes, servings, meal_type, difficulty, source_type, source_name) VALUES ('rec-salada-frutas', 'Salada de frutas simples', 'salada-frutas', 'Mistura fresca de frutas para lanche ou sobremesa.', '1. Corte todas as frutas em cubos.\n2. Regue com suco de laranja e limão.\n3. Misture e sirva gelado.', 10, 4, 'sobremesa', 'FACIL', 'OWN', 'Receitando');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-salada-frutas', 'catalogo-proprio');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-salada-frutas', 'sobremesa');
INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES ('rec-salada-frutas', 'rapida');
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1085', 'rec-salada-frutas', 'ing-banana', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1086', 'rec-salada-frutas', 'ing-maçã', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1087', 'rec-salada-frutas', 'ing-laranja', 2, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1088', 'rec-salada-frutas', 'ing-morango', 8, 'unidades', 0);
INSERT OR IGNORE INTO recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, optional) VALUES ('ri-v2-1089', 'rec-salada-frutas', 'ing-limao', 0.5, 'unidade', 1);
