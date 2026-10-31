# Catálogo do Receitando

Os dados do catálogo, receitas, ingredientes, aliases, tags e relações persistem no **Neon PostgreSQL**. Imagens ficam no **Cloudflare R2**; as tabelas registram metadados e URL. A API em Cloudflare Workers realiza busca, filtro e matching por ingredientes canônicos.

## Conteúdos próprios e referências externas
Receitas originais e materiais enviados pelos usuários devem seguir políticas de origem, autoria e moderação. As referências de TudoGostoso, Receiteria e Panelinha são **links editoriais**, não cópias livres de receita/imagem. Não republicar textos ou fotos protegidos sem permissão específica.

[Schema PostgreSQL](database.md) · [Fontes e direitos autorais](fontes-brasileiras-direitos-autorais.md) · [Funcionalidades](funcionalidades.md).
