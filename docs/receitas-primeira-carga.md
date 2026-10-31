# Primeira carga de receitas autorais no Neon

Lote: **16 receitas completas** (preparo, ingredientes ligados a IDs canônicos, porções, tags e créditos das fotografias quando disponíveis).

Fonte dos textos: redação original para o Receitando, com técnicas culinárias comuns. Não foram copiados textos ou imagens de TudoGostoso, Panelinha ou Receiteria.

Arquivo de implantação idempotente: `backend/worker-prototype/migrations/postgres/0003_seed_curated_recipes.sql`.
Executar no banco `receitando` do Neon de forma transacional. A carga usa `ON CONFLICT DO NOTHING`: permite reaplicação sem duplicação e preserva registros anteriores.

A listagem do catálogo v2 foi atualizada para incluir `OWN`, `OPEN_DATASET`, `USER` e aceitar foto nula. O frontend já possui uma ilustração substituta para receita sem foto. As fotos verificadas são atribuídas aos respectivos fotógrafos, com página de origem e licença. Não atribuir fotos semelhantes a receitas diferentes.

**Meta posterior:** ampliar para 10.000+ com obras autorais ou licenças expressas, verificação culinária, deduplicação de títulos/ingredientes e acervo de fotografias licenciadas. Não contar links externos como receitas completas.
