# Receitando — produção no Neon PostgreSQL + Cloudflare Hyperdrive

## Estado confirmado (30/10/2026)

A API `round-mouse-8bbd` foi publicada com `DATABASE_ENGINE=postgres`, e o binding `HYPERDRIVE` foi validado. O antigo banco D1 de produção `receitando` (`af1f7dbc-50a3-497c-9188-2f57467ae49b`) foi **excluído da Cloudflare a pedido do proprietário**, após confirmar que nenhum Worker ativo tinha vínculo com ele. A exclusão retornou HTTP 200 e o banco deixou de aparecer na listagem.

O banco separado `receitando-benchmark-isolado` não foi excluído.

## Escopo da nova base

- **Não importados:** contas, sessões, receitas, imagens associadas, favoritos e outros dados relacionados às receitas antigas. Usuários antigos precisam se cadastrar novamente.
- **Catálogo de receitas:** inicia vazio, aguardando receitas novas. A API foi testada com lista vazia.
- **Ingredientes:** a importação foi dispensada, mas uma cópia parcial de **920 ingredientes** foi realizada durante a preparação e continua no Neon. A API de ingredientes lista os que aparecem em receitas cadastradas; nenhum catálogo antigo foi migrado. Qualquer limpeza dos 920 ingredientes remanescentes deve ser uma operação separada e explicitamente autorizada.
- **Não migrar por engano:** o comando `npm run migrate:postgres` está deliberadamente desabilitado.

## Plataforma

- Neon: projeto `Receitando`, PostgreSQL 17.11, banco `receitando`, branch `production`, São Paulo.
- Cloudflare Hyperdrive: `receitando-postgres-neon` ID `f3d216f3a0cc4c81990b03bdca9b87ea`, cache SQL desativado.
- Worker `round-mouse-8bbd`: usa exclusivamente o binding Hyperdrive para dados relacionais.
- Cloudflare R2: `receitando-recipe-images` permanece para imagens.
- Durable Objects: `CookingRoom` permanece para cozinhar junto.

## Verificações

1. Worker isolado executou uma consulta real `SELECT 1` através de Hyperdrive: banco `receitando`, 15 tabelas, PostgreSQL 17.11.
2. Integração PostgreSQL e testes do Worker com cadastro/login, sessões, receitas, favoritos, despensa e WebSocket passaram no GitHub Actions.
3. Produção respondeu HTTP 200 nas rotas `/api/health`, `/api/v2/recipes`, `/api/recipes`, `/api/home-feed` e `/api/ingredients` após a correção de ordenação da rota de ingredientes.
4. O binding D1 foi removido do Worker e a exclusão do banco foi confirmada posteriormente.

## Recuperação

**Não existe mais rollback direto via `DATABASE_ENGINE=d1`**, pois o D1 antigo foi excluído. Para recuperar registros legados seria necessário investigar mecanismos de recuperação da Cloudflare; não há garantia de disponibilidade. Os dados novos no Neon devem ter proteção independente por backups e recursos de recuperação do Neon.

A nova API segue com `DATABASE_ENGINE=postgres`; R2 e Durable Objects não foram apagados.
