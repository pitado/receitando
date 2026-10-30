# Receitando — PostgreSQL + Hyperdrive em produção

## Escopo autorizado (30/10/2026)

A migração inicial não transfere **contas, sessões, receitas nem seus relacionamentos** do D1. Usuários existentes deverão se registrar novamente. O catálogo de receitas começará vazio e novas receitas serão criadas no Neon.

A migração de ingredientes também não é necessária. Durante a preparação do corte houve uma cópia parcial de **920 ingredientes** para a nova base Neon; estes registros não correspondem ao catálogo de receitas. Eles devem ser tratados em uma operação de limpeza autorizada separadamente caso a intenção seja iniciar também o dicionário de ingredientes completamente vazio. A cópia foi feita apenas para Neon, sem exclusão do D1.

## Plataforma

- PostgreSQL: Neon projeto `Receitando`, banco `receitando`, branch `production`, São Paulo, versão 17.
- Hyperdrive: `receitando-postgres-neon` com ID `f3d216f3a0cc4c81990b03bdca9b87ea`, cache SQL desativado.
- API: Cloudflare Worker `round-mouse-8bbd` com `DATABASE_ENGINE=postgres`.
- D1: binding mantido como opção de rollback, sem importação de dados.
- R2: `receitando-recipe-images` mantido para imagens.
- Durable Objects: `CookingRoom` mantido para o cozinhar junto.

## Validações já concluídas

1. Consulta `SELECT 1` através de um Worker isolado e do Hyperdrive chegou ao Neon: PostgreSQL 17.11, banco `receitando`, 15 tabelas.
2. Esquema no Neon: 15 tabelas e índices, busca full-text com `to_tsvector`.
3. GitHub Actions: testes de autenticação, catálogo, despensa, favoritos e WebSocket passaram com PostgreSQL de integração.
4. O script `npm run migrate:postgres` foi desativado intencionalmente para evitar importações antigas.

## Publicação e validação

O `wrangler.jsonc` contém o binding D1 para rollback e o binding Hyperdrive para PostgreSQL. Antes de finalizar a troca, confirmar:

- `/api/health` devolve 200.
- Endpoints de receitas, home e ingredientes respondem sem erros com os novos dados.
- Cadastro e login com conta nova funcionam após o cutover.
- Cookies, CORS, R2 e WebSocket continuam operacionais.
- Logs da Cloudflare sem erros de `pg` / SQL.

Rollback: definir `DATABASE_ENGINE=d1` e redeployar o Worker anterior caso necessário; não apagar D1 nem dados no Neon. A conta e as receitas novas no Neon não aparecerão durante rollback, pois os bancos são separados.

**Não excluir a base D1 antiga.**
