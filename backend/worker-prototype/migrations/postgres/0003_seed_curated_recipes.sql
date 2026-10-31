-- Catálogo autoral Receitando (16 receitas). Textos redigidos para o projeto; não são cópia de sites.
-- Inserção idempotente para PostgreSQL/Neon. Não remove nem altera dados existentes.
-- Fotos: somente arquivos verificados no Wikimedia Commons; créditos e licenças preservados.
BEGIN;
INSERT INTO recipes (id,title,slug,description,instructions,prep_minutes,servings,meal_type,difficulty,source_type,source_name,image_url,image_source,image_author,image_page_url,image_license,image_license_url,image_alt) VALUES
('rec-autoral-arroz-branco-soltinho','Arroz branco soltinho','arroz-branco-soltinho','Arroz do dia a dia feito com alho, água quente e cozimento sem mexer.','1. Lave o arroz, se desejar, e escorra completamente.
2. Aqueça o azeite e refogue o alho em fogo baixo por alguns segundos, sem deixar queimar.
3. Junte o arroz e mexa por 1 minuto para envolver os grãos.
4. Acrescente a água quente e o sal; cozinhe em fogo médio até a água ficar na altura dos grãos.
5. Tampe parcialmente e reduza o fogo. Cozinhe até secar e os grãos ficarem macios.
6. Desligue, deixe descansar por 5 minutos tampado e solte com um garfo.',30,4,'Almoço','FACIL','OWN','Receitando',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
('rec-autoral-omelete-tomate-champignon','Omelete de tomate e champignon','omelete-tomate-champignon','Ovos macios com tomate, cogumelos e salsinha para uma refeição rápida.','1. Pique o tomate, os cogumelos e a salsinha.
2. Bata ligeiramente os ovos com o sal, sem formar espuma em excesso.
3. Aqueça a manteiga numa frigideira antiaderente e salteie o champignon por 2 minutos.
4. Acrescente o tomate e despeje os ovos. Espalhe a salsinha por cima.
5. Cozinhe em fogo baixo até firmar; dobre ao meio e sirva com os ovos completamente cozidos.',15,2,'Café da manhã','FACIL','OWN','Receitando','https://upload.wikimedia.org/wikipedia/commons/0/00/Omelete%2C_Omelette..jpg','Wikimedia Commons','Pandsu','https://commons.wikimedia.org/wiki/File:Omelete%2C_Omelette..jpg','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/','Omelete de tomate, cogumelos e ervas'),
('rec-autoral-panqueca-banana-aveia','Panqueca de banana e aveia','panqueca-banana-aveia','Panquecas pequenas e douradas, naturalmente doces pela banana madura.','1. Amasse as bananas com um garfo até formar um purê.
2. Misture os ovos, a aveia e a canela até obter uma massa homogênea.
3. Aqueça uma frigideira antiaderente em fogo baixo.
4. Coloque pequenas porções da massa e doure por aproximadamente 2 minutos de cada lado, virando quando firmarem.
5. Sirva ainda morna.',15,2,'Café da manhã','FACIL','OWN','Receitando',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
('rec-autoral-macarrao-alho-oleo','Macarrão alho e óleo','macarrao-alho-oleo','Massa simples com alho dourado e azeite, pronta em poucos minutos.','1. Cozinhe o macarrão em bastante água fervente com sal até ficar al dente; reserve meia xícara da água do cozimento.
2. Fatie o alho e aqueça o azeite numa frigideira ampla em fogo baixo.
3. Deixe o alho perfumar e dourar levemente, sem escurecer.
4. Junte a massa escorrida e algumas colheres da água reservada; envolva bem.
5. Finalize com salsinha e sirva imediatamente.',20,3,'Jantar','FACIL','OWN','Receitando',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
('rec-autoral-batatas-rusticas-paprica','Batatas rústicas com páprica','batatas-rusticas-paprica','Batatas assadas com casca, macias por dentro e douradas por fora.','1. Aqueça o forno a 220 °C e lave bem as batatas.
2. Corte em gomos de espessura semelhante, mantendo a casca.
3. Seque, misture com azeite, páprica, orégano e sal.
4. Disponha numa assadeira em uma única camada sem amontoar.
5. Asse por 35 a 45 minutos, virando na metade do tempo, até dourarem e ficarem macias.',50,4,'Jantar','FACIL','OWN','Receitando',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
('rec-autoral-frango-grelhado-limao','Frango grelhado com limão','frango-grelhado-limao','Filés de frango temperados com alho e limão, dourados na frigideira.','1. Corte o peito de frango em filés de espessura uniforme.
2. Tempere com suco de limão, alho amassado, páprica e sal; deixe descansar 10 minutos sob refrigeração.
3. Aqueça o azeite em frigideira em fogo médio-alto.
4. Grelhe os filés dos dois lados até dourarem e atingirem 74 °C no centro.
5. Deixe descansar por 2 minutos antes de servir.',30,3,'Almoço','FACIL','OWN','Receitando',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
('rec-autoral-brigadeiro-de-panela','Brigadeiro de panela','brigadeiro-de-panela','Doce brasileiro de chocolate com textura cremosa, ideal para enrolar depois de esfriar.','1. Coloque o leite condensado, o cacau e a manteiga em uma panela de fundo grosso.
2. Misture bem antes de ligar o fogo para desfazer os grumos.
3. Cozinhe em fogo baixo, mexendo continuamente e raspando fundo e laterais.
4. Para enrolar, retire do fogo quando a massa soltar do fundo da panela ao passar a espátula.
5. Transfira para um prato untado, cubra e deixe esfriar.
6. Com mãos ligeiramente untadas, faça bolinhas e passe no granulado, se desejar.',50,20,'Sobremesa','FACIL','OWN','Receitando','https://upload.wikimedia.org/wikipedia/commons/b/bb/BrigadeiroBrazil.jpg','Wikimedia Commons','VitorTo','https://commons.wikimedia.org/wiki/File:BrigadeiroBrazil.jpg','CC BY-SA 3.0','https://creativecommons.org/licenses/by-sa/3.0/','Brigadeiro de chocolate com granulado'),
('rec-autoral-bolo-cenoura-chocolate','Bolo de cenoura com chocolate','bolo-cenoura-chocolate','Bolo fofinho de cenoura com cobertura simples de chocolate.','1. Preaqueça o forno a 180 °C. Unte e enfarinhe uma forma média.
2. Bata no liquidificador a cenoura cortada, os ovos e o óleo até a mistura ficar lisa.
3. Misture o creme com o açúcar e incorpore à farinha numa tigela, sem bater demais.
4. Junte o fermento delicadamente e despeje na forma.
5. Asse por 35 a 45 minutos; teste com palito no centro e deixe esfriar.
6. Derreta o chocolate em intervalos curtos, misture o creme de leite, espalhe sobre o bolo e finalize com granulado, se desejar.',70,10,'Sobremesa','MEDIA','OWN','Receitando','https://upload.wikimedia.org/wikipedia/commons/c/cc/Bolo_de_cenoura_com_chocolate_e_granulado.jpg','Wikimedia Commons','Sintegrity','https://commons.wikimedia.org/wiki/File:Bolo_de_cenoura_com_chocolate_e_granulado.jpg','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/','Bolo de cenoura com cobertura de chocolate e granulado'),
('rec-autoral-sopa-caseira-legumes','Sopa caseira de legumes','sopa-caseira-legumes','Caldo reconfortante com batata, cenoura e abobrinha.','1. Lave, descasque e corte os legumes em cubos parecidos.
2. Refogue cebola e alho no azeite até ficarem macios.
3. Adicione a batata, a cenoura, a abobrinha e a água.
4. Leve à fervura, abaixe o fogo e cozinhe por cerca de 25 minutos, até os legumes amaciarem.
5. Tempere com sal e amasse parte dos legumes para engrossar o caldo.
6. Sirva bem quente.',45,4,'Jantar','FACIL','OWN','Receitando',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
('rec-autoral-mousse-limao-simples','Mousse de limão simples','mousse-limao-simples','Sobremesa cremosa de três ingredientes, servida bem gelada.','1. Lave os limões e esprema o suco, descartando as sementes.
2. Misture o leite condensado e o creme de leite numa tigela.
3. Acrescente o suco de limão aos poucos, mexendo até engrossar.
4. Distribua em taças individuais e leve à geladeira por pelo menos 3 horas.
5. Sirva gelado e mantenha refrigerado.',190,6,'Sobremesa','FACIL','OWN','Receitando',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
('rec-autoral-arroz-cenoura','Arroz com cenoura','arroz-cenoura','Variação colorida do arroz cotidiano com cenoura ralada.','1. Rale a cenoura e pique a cebola.
2. Aqueça o óleo e refogue a cebola até ficar translúcida.
3. Adicione a cenoura e o arroz, mexendo por 1 minuto.
4. Coloque água quente e sal; cozinhe até o líquido quase secar.
5. Tampe, abaixe o fogo e deixe terminar de cozinhar; descanse por 5 minutos antes de servir.',30,4,'Almoço','FACIL','OWN','Receitando',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
('rec-autoral-vitamina-banana-aveia','Vitamina de banana e aveia','vitamina-banana-aveia','Bebida cremosa para o café da manhã ou lanche.','1. Descasque as bananas e corte em pedaços.
2. Coloque banana, leite e aveia no liquidificador.
3. Bata por cerca de 40 segundos até ficar homogêneo.
4. Se desejar, salpique canela e sirva imediatamente, de preferência gelado.',5,2,'Café da manhã','FACIL','OWN','Receitando',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
('rec-autoral-macarrao-cremoso-tomate','Macarrão cremoso com tomate','macarrao-cremoso-tomate','Massa envolvida num molho de tomate fresco e creme de leite.','1. Cozinhe a massa em água fervente com sal até ficar al dente.
2. Refogue a cebola e o alho no azeite até perfumarem.
3. Junte o tomate picado e cozinhe por 8 a 10 minutos, até formar um molho.
4. Reduza o fogo, misture o creme de leite e ajuste o sal.
5. Envolva a massa no molho e sirva quente.',30,4,'Jantar','FACIL','OWN','Receitando',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
('rec-autoral-panqueca-salgada-basica','Massa básica de panqueca salgada','panqueca-salgada-basica','Discos finos de frigideira que podem receber recheios variados.','1. Bata o leite, os ovos, a farinha, o óleo e o sal até formar uma massa lisa.
2. Deixe a massa repousar por 5 minutos.
3. Aqueça uma frigideira antiaderente e espalhe uma concha pequena, formando camada fina.
4. Quando as bordas se soltarem, vire com cuidado e doure o outro lado.
5. Repita até terminar a massa. Recheie com queijo ou outro recheio já cozido, se desejar.
6. Sirva em seguida ou aqueça rapidamente após rechear.',25,6,'Lanche','FACIL','OWN','Receitando',NULL,NULL,NULL,NULL,NULL,NULL,NULL),
('rec-autoral-pao-de-queijo-mineiro','Pão de queijo caseiro','pao-de-queijo-mineiro','Pãezinhos de polvilho com queijo, assados até ficarem levemente dourados.','1. Preaqueça o forno a 200 °C e forre uma assadeira.
2. Aqueça o leite, o óleo e o sal até começar a ferver.
3. Despeje o líquido quente sobre o polvilho e misture com colher até amornar.
4. Acrescente o ovo e o queijo ralado; amasse até ficar uniforme e moldável.
5. Com mãos levemente untadas, modele bolinhas e distribua com espaço entre elas.
6. Asse por cerca de 20 a 30 minutos até crescerem e dourarem levemente. Sirva morno.',50,20,'Lanche','MEDIA','OWN','Receitando','https://upload.wikimedia.org/wikipedia/commons/a/aa/Pao_de_queijo_brasil.jpg','Wikimedia Commons','Acfariac','https://commons.wikimedia.org/wiki/File:Pao_de_queijo_brasil.jpg','CC BY-SA 4.0','https://creativecommons.org/licenses/by-sa/4.0/','Pães de queijo assados ao lado de uma xícara de café'),
('rec-autoral-ovos-mexidos-cremosos','Ovos mexidos cremosos','ovos-mexidos-cremosos','Ovos delicados preparados lentamente na frigideira.','1. Quebre os ovos numa tigela e misture até gemas e claras se combinarem.
2. Se desejar, adicione o leite e uma pitada de sal.
3. Derreta a manteiga numa frigideira em fogo baixo.
4. Coloque os ovos e mexa devagar com espátula até atingir consistência cremosa e completamente cozida.
5. Sirva imediatamente.',10,2,'Café da manhã','FACIL','OWN','Receitando',NULL,NULL,NULL,NULL,NULL,NULL,NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipe_ingredients (id,recipe_id,ingredient_id,quantity,unit,optional,raw_text) VALUES
('ri-autoral-arroz-branco-soltinho-1','rec-autoral-arroz-branco-soltinho','ing-arroz',1,'xícara',0,'1 xícara'),
('ri-autoral-arroz-branco-soltinho-2','rec-autoral-arroz-branco-soltinho','ext-ing-c1962c232baf51a7',2,'xícaras',0,'2 xícaras'),
('ri-autoral-arroz-branco-soltinho-3','rec-autoral-arroz-branco-soltinho','ing-alho',2,'dentes',0,'2 dentes'),
('ri-autoral-arroz-branco-soltinho-4','rec-autoral-arroz-branco-soltinho','ing-azeite',1,'colher de sopa',0,'1 colher de sopa'),
('ri-autoral-arroz-branco-soltinho-5','rec-autoral-arroz-branco-soltinho','ing-sal',0.5,'colher de chá',0,'0,5 colher de chá'),
('ri-autoral-omelete-tomate-champignon-1','rec-autoral-omelete-tomate-champignon','ing-ovo',3,'unidades',0,'3 unidades'),
('ri-autoral-omelete-tomate-champignon-2','rec-autoral-omelete-tomate-champignon','ing-tomate',1,'unidade',0,'1 unidade'),
('ri-autoral-omelete-tomate-champignon-3','rec-autoral-omelete-tomate-champignon','ext-ing-b1c8d28fef3b7d33',70,'g',0,'70 g'),
('ri-autoral-omelete-tomate-champignon-4','rec-autoral-omelete-tomate-champignon','ing-salsinha',1,'colher de sopa',0,'1 colher de sopa'),
('ri-autoral-omelete-tomate-champignon-5','rec-autoral-omelete-tomate-champignon','ing-manteiga',1,'colher de chá',0,'1 colher de chá'),
('ri-autoral-omelete-tomate-champignon-6','rec-autoral-omelete-tomate-champignon','ing-sal',0.25,'colher de chá',0,'0,25 colher de chá'),
('ri-autoral-panqueca-banana-aveia-1','rec-autoral-panqueca-banana-aveia','ing-banana',2,'unidades',0,'2 unidades'),
('ri-autoral-panqueca-banana-aveia-2','rec-autoral-panqueca-banana-aveia','ing-ovo',2,'unidades',0,'2 unidades'),
('ri-autoral-panqueca-banana-aveia-3','rec-autoral-panqueca-banana-aveia','ing-aveia',4,'colheres de sopa',0,'4 colheres de sopa'),
('ri-autoral-panqueca-banana-aveia-4','rec-autoral-panqueca-banana-aveia','ing-canela',0.5,'colher de chá',0,'0,5 colher de chá'),
('ri-autoral-macarrao-alho-oleo-1','rec-autoral-macarrao-alho-oleo','ing-macarrao',250,'g',0,'250 g'),
('ri-autoral-macarrao-alho-oleo-2','rec-autoral-macarrao-alho-oleo','ing-alho',4,'dentes',0,'4 dentes'),
('ri-autoral-macarrao-alho-oleo-3','rec-autoral-macarrao-alho-oleo','ing-azeite',3,'colheres de sopa',0,'3 colheres de sopa'),
('ri-autoral-macarrao-alho-oleo-4','rec-autoral-macarrao-alho-oleo','ing-sal',1,'colher de chá',0,'1 colher de chá'),
('ri-autoral-macarrao-alho-oleo-5','rec-autoral-macarrao-alho-oleo','ing-salsinha',1,'colher de sopa',0,'1 colher de sopa'),
('ri-autoral-batatas-rusticas-paprica-1','rec-autoral-batatas-rusticas-paprica','ing-batata',4,'unidades',0,'4 unidades'),
('ri-autoral-batatas-rusticas-paprica-2','rec-autoral-batatas-rusticas-paprica','ing-azeite',2,'colheres de sopa',0,'2 colheres de sopa'),
('ri-autoral-batatas-rusticas-paprica-3','rec-autoral-batatas-rusticas-paprica','ing-paprica',1,'colher de chá',0,'1 colher de chá'),
('ri-autoral-batatas-rusticas-paprica-4','rec-autoral-batatas-rusticas-paprica','ing-sal',1,'colher de chá',0,'1 colher de chá'),
('ri-autoral-batatas-rusticas-paprica-5','rec-autoral-batatas-rusticas-paprica','ing-oregano',1,'colher de chá',0,'1 colher de chá'),
('ri-autoral-frango-grelhado-limao-1','rec-autoral-frango-grelhado-limao','ing-frango',500,'g',0,'500 g'),
('ri-autoral-frango-grelhado-limao-2','rec-autoral-frango-grelhado-limao','ing-limao',1,'unidade',0,'1 unidade'),
('ri-autoral-frango-grelhado-limao-3','rec-autoral-frango-grelhado-limao','ing-alho',2,'dentes',0,'2 dentes'),
('ri-autoral-frango-grelhado-limao-4','rec-autoral-frango-grelhado-limao','ing-azeite',1,'colher de sopa',0,'1 colher de sopa'),
('ri-autoral-frango-grelhado-limao-5','rec-autoral-frango-grelhado-limao','ing-sal',1,'colher de chá',0,'1 colher de chá'),
('ri-autoral-frango-grelhado-limao-6','rec-autoral-frango-grelhado-limao','ing-paprica',0.5,'colher de chá',0,'0,5 colher de chá'),
('ri-autoral-brigadeiro-de-panela-1','rec-autoral-brigadeiro-de-panela','ing-leite-condensado',395,'g',0,'395 g'),
('ri-autoral-brigadeiro-de-panela-2','rec-autoral-brigadeiro-de-panela','ing-cacau',3,'colheres de sopa',0,'3 colheres de sopa'),
('ri-autoral-brigadeiro-de-panela-3','rec-autoral-brigadeiro-de-panela','ing-manteiga',1,'colher de sopa',0,'1 colher de sopa'),
('ri-autoral-brigadeiro-de-panela-4','rec-autoral-brigadeiro-de-panela','ext-ing-a5a5034153f3a830',80,'g',1,'80 g'),
('ri-autoral-bolo-cenoura-chocolate-1','rec-autoral-bolo-cenoura-chocolate','ing-cenoura',2,'unidades',0,'2 unidades'),
('ri-autoral-bolo-cenoura-chocolate-2','rec-autoral-bolo-cenoura-chocolate','ing-ovo',3,'unidades',0,'3 unidades'),
('ri-autoral-bolo-cenoura-chocolate-3','rec-autoral-bolo-cenoura-chocolate','ing-oleo',0.5,'xícara',0,'0,5 xícara'),
('ri-autoral-bolo-cenoura-chocolate-4','rec-autoral-bolo-cenoura-chocolate','ing-acucar',1.5,'xícaras',0,'1,5 xícaras'),
('ri-autoral-bolo-cenoura-chocolate-5','rec-autoral-bolo-cenoura-chocolate','ing-farinha-trigo',2,'xícaras',0,'2 xícaras'),
('ri-autoral-bolo-cenoura-chocolate-6','rec-autoral-bolo-cenoura-chocolate','ext-ing-1a983a398daf1f2f',1,'colher de sopa',0,'1 colher de sopa'),
('ri-autoral-bolo-cenoura-chocolate-7','rec-autoral-bolo-cenoura-chocolate','ing-chocolate',120,'g',0,'120 g'),
('ri-autoral-bolo-cenoura-chocolate-8','rec-autoral-bolo-cenoura-chocolate','ing-creme-leite',100,'g',0,'100 g'),
('ri-autoral-bolo-cenoura-chocolate-9','rec-autoral-bolo-cenoura-chocolate','ext-ing-a5a5034153f3a830',30,'g',1,'30 g'),
('ri-autoral-sopa-caseira-legumes-1','rec-autoral-sopa-caseira-legumes','ing-batata',3,'unidades',0,'3 unidades'),
('ri-autoral-sopa-caseira-legumes-2','rec-autoral-sopa-caseira-legumes','ing-cenoura',2,'unidades',0,'2 unidades'),
('ri-autoral-sopa-caseira-legumes-3','rec-autoral-sopa-caseira-legumes','ing-abobrinha',1,'unidade',0,'1 unidade'),
('ri-autoral-sopa-caseira-legumes-4','rec-autoral-sopa-caseira-legumes','ing-cebola',1,'unidade',0,'1 unidade'),
('ri-autoral-sopa-caseira-legumes-5','rec-autoral-sopa-caseira-legumes','ing-alho',2,'dentes',0,'2 dentes'),
('ri-autoral-sopa-caseira-legumes-6','rec-autoral-sopa-caseira-legumes','ext-ing-c1962c232baf51a7',1.2,'litro',0,'1,2 litro'),
('ri-autoral-sopa-caseira-legumes-7','rec-autoral-sopa-caseira-legumes','ing-azeite',1,'colher de sopa',0,'1 colher de sopa'),
('ri-autoral-sopa-caseira-legumes-8','rec-autoral-sopa-caseira-legumes','ing-sal',1,'colher de chá',0,'1 colher de chá'),
('ri-autoral-mousse-limao-simples-1','rec-autoral-mousse-limao-simples','ing-leite-condensado',395,'g',0,'395 g'),
('ri-autoral-mousse-limao-simples-2','rec-autoral-mousse-limao-simples','ing-creme-leite',200,'g',0,'200 g'),
('ri-autoral-mousse-limao-simples-3','rec-autoral-mousse-limao-simples','ing-limao',3,'unidades',0,'3 unidades'),
('ri-autoral-arroz-cenoura-1','rec-autoral-arroz-cenoura','ing-arroz',1,'xícara',0,'1 xícara'),
('ri-autoral-arroz-cenoura-2','rec-autoral-arroz-cenoura','ing-cenoura',1,'unidade',0,'1 unidade'),
('ri-autoral-arroz-cenoura-3','rec-autoral-arroz-cenoura','ing-cebola',0.5,'unidade',0,'0,5 unidade'),
('ri-autoral-arroz-cenoura-4','rec-autoral-arroz-cenoura','ext-ing-c1962c232baf51a7',2,'xícaras',0,'2 xícaras'),
('ri-autoral-arroz-cenoura-5','rec-autoral-arroz-cenoura','ing-oleo',1,'colher de sopa',0,'1 colher de sopa'),
('ri-autoral-arroz-cenoura-6','rec-autoral-arroz-cenoura','ing-sal',0.5,'colher de chá',0,'0,5 colher de chá'),
('ri-autoral-vitamina-banana-aveia-1','rec-autoral-vitamina-banana-aveia','ing-banana',2,'unidades',0,'2 unidades'),
('ri-autoral-vitamina-banana-aveia-2','rec-autoral-vitamina-banana-aveia','ing-leite',400,'ml',0,'400 ml'),
('ri-autoral-vitamina-banana-aveia-3','rec-autoral-vitamina-banana-aveia','ing-aveia',2,'colheres de sopa',0,'2 colheres de sopa'),
('ri-autoral-vitamina-banana-aveia-4','rec-autoral-vitamina-banana-aveia','ing-canela',0.5,'colher de chá',1,'0,5 colher de chá'),
('ri-autoral-macarrao-cremoso-tomate-1','rec-autoral-macarrao-cremoso-tomate','ing-macarrao',350,'g',0,'350 g'),
('ri-autoral-macarrao-cremoso-tomate-2','rec-autoral-macarrao-cremoso-tomate','ing-tomate',3,'unidades',0,'3 unidades'),
('ri-autoral-macarrao-cremoso-tomate-3','rec-autoral-macarrao-cremoso-tomate','ing-cebola',0.5,'unidade',0,'0,5 unidade'),
('ri-autoral-macarrao-cremoso-tomate-4','rec-autoral-macarrao-cremoso-tomate','ing-alho',2,'dentes',0,'2 dentes'),
('ri-autoral-macarrao-cremoso-tomate-5','rec-autoral-macarrao-cremoso-tomate','ing-creme-leite',200,'g',0,'200 g'),
('ri-autoral-macarrao-cremoso-tomate-6','rec-autoral-macarrao-cremoso-tomate','ing-azeite',1,'colher de sopa',0,'1 colher de sopa'),
('ri-autoral-macarrao-cremoso-tomate-7','rec-autoral-macarrao-cremoso-tomate','ing-sal',1,'colher de chá',0,'1 colher de chá'),
('ri-autoral-panqueca-salgada-basica-1','rec-autoral-panqueca-salgada-basica','ing-farinha-trigo',1,'xícara',0,'1 xícara'),
('ri-autoral-panqueca-salgada-basica-2','rec-autoral-panqueca-salgada-basica','ing-leite',1,'xícara',0,'1 xícara'),
('ri-autoral-panqueca-salgada-basica-3','rec-autoral-panqueca-salgada-basica','ing-ovo',2,'unidades',0,'2 unidades'),
('ri-autoral-panqueca-salgada-basica-4','rec-autoral-panqueca-salgada-basica','ing-oleo',1,'colher de sopa',0,'1 colher de sopa'),
('ri-autoral-panqueca-salgada-basica-5','rec-autoral-panqueca-salgada-basica','ing-sal',0.5,'colher de chá',0,'0,5 colher de chá'),
('ri-autoral-panqueca-salgada-basica-6','rec-autoral-panqueca-salgada-basica','ing-queijo',150,'g',1,'150 g'),
('ri-autoral-pao-de-queijo-mineiro-1','rec-autoral-pao-de-queijo-mineiro','ext-ing-74023540d89e48b9',250,'g',0,'250 g'),
('ri-autoral-pao-de-queijo-mineiro-2','rec-autoral-pao-de-queijo-mineiro','ing-leite',120,'ml',0,'120 ml'),
('ri-autoral-pao-de-queijo-mineiro-3','rec-autoral-pao-de-queijo-mineiro','ing-oleo',60,'ml',0,'60 ml'),
('ri-autoral-pao-de-queijo-mineiro-4','rec-autoral-pao-de-queijo-mineiro','ing-ovo',1,'unidade',0,'1 unidade'),
('ri-autoral-pao-de-queijo-mineiro-5','rec-autoral-pao-de-queijo-mineiro','ing-queijo',150,'g',0,'150 g'),
('ri-autoral-pao-de-queijo-mineiro-6','rec-autoral-pao-de-queijo-mineiro','ing-sal',0.5,'colher de chá',0,'0,5 colher de chá'),
('ri-autoral-ovos-mexidos-cremosos-1','rec-autoral-ovos-mexidos-cremosos','ing-ovo',3,'unidades',0,'3 unidades'),
('ri-autoral-ovos-mexidos-cremosos-2','rec-autoral-ovos-mexidos-cremosos','ing-manteiga',1,'colher de chá',0,'1 colher de chá'),
('ri-autoral-ovos-mexidos-cremosos-3','rec-autoral-ovos-mexidos-cremosos','ing-leite',1,'colher de sopa',1,'1 colher de sopa'),
('ri-autoral-ovos-mexidos-cremosos-4','rec-autoral-ovos-mexidos-cremosos','ing-sal',0.25,'colher de chá',0,'0,25 colher de chá')
ON CONFLICT (recipe_id,ingredient_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id,tag) VALUES
('rec-autoral-arroz-branco-soltinho','catalogo-autoral'),
('rec-autoral-arroz-branco-soltinho','arroz'),
('rec-autoral-arroz-branco-soltinho','brasileira'),
('rec-autoral-omelete-tomate-champignon','catalogo-autoral'),
('rec-autoral-omelete-tomate-champignon','ovos'),
('rec-autoral-omelete-tomate-champignon','rapida'),
('rec-autoral-panqueca-banana-aveia','catalogo-autoral'),
('rec-autoral-panqueca-banana-aveia','banana'),
('rec-autoral-panqueca-banana-aveia','sem-farinha'),
('rec-autoral-macarrao-alho-oleo','catalogo-autoral'),
('rec-autoral-macarrao-alho-oleo','massa'),
('rec-autoral-macarrao-alho-oleo','rapida'),
('rec-autoral-batatas-rusticas-paprica','catalogo-autoral'),
('rec-autoral-batatas-rusticas-paprica','assado'),
('rec-autoral-batatas-rusticas-paprica','vegetariana'),
('rec-autoral-frango-grelhado-limao','catalogo-autoral'),
('rec-autoral-frango-grelhado-limao','frango'),
('rec-autoral-frango-grelhado-limao','proteina'),
('rec-autoral-brigadeiro-de-panela','catalogo-autoral'),
('rec-autoral-brigadeiro-de-panela','brasileira'),
('rec-autoral-brigadeiro-de-panela','chocolate'),
('rec-autoral-bolo-cenoura-chocolate','catalogo-autoral'),
('rec-autoral-bolo-cenoura-chocolate','bolo'),
('rec-autoral-bolo-cenoura-chocolate','chocolate'),
('rec-autoral-sopa-caseira-legumes','catalogo-autoral'),
('rec-autoral-sopa-caseira-legumes','sopa'),
('rec-autoral-sopa-caseira-legumes','vegetariana'),
('rec-autoral-mousse-limao-simples','catalogo-autoral'),
('rec-autoral-mousse-limao-simples','sobremesa'),
('rec-autoral-mousse-limao-simples','gelada'),
('rec-autoral-arroz-cenoura','catalogo-autoral'),
('rec-autoral-arroz-cenoura','arroz'),
('rec-autoral-arroz-cenoura','vegetariana'),
('rec-autoral-vitamina-banana-aveia','catalogo-autoral'),
('rec-autoral-vitamina-banana-aveia','bebida'),
('rec-autoral-vitamina-banana-aveia','rapida'),
('rec-autoral-macarrao-cremoso-tomate','catalogo-autoral'),
('rec-autoral-macarrao-cremoso-tomate','massa'),
('rec-autoral-macarrao-cremoso-tomate','cremosa'),
('rec-autoral-panqueca-salgada-basica','catalogo-autoral'),
('rec-autoral-panqueca-salgada-basica','panqueca'),
('rec-autoral-panqueca-salgada-basica','versatil'),
('rec-autoral-pao-de-queijo-mineiro','catalogo-autoral'),
('rec-autoral-pao-de-queijo-mineiro','mineira'),
('rec-autoral-pao-de-queijo-mineiro','sem-gluten'),
('rec-autoral-ovos-mexidos-cremosos','catalogo-autoral'),
('rec-autoral-ovos-mexidos-cremosos','ovos'),
('rec-autoral-ovos-mexidos-cremosos','rapida')
ON CONFLICT (recipe_id,tag) DO NOTHING;
COMMIT;
