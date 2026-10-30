# Migração segura do Receitando para PostgreSQL + Hyperdrive

**Estado:** código de migração em preparação na branch de homologação. **Produção permanece em Cloudflare D1** até finalizar conexão Neon, cópia, auditoria e testes remotos.

## Importante: dados reais

Em 30/10/2026, a produção já tinha usuários, sessões, receitas, despensa e envios de receita. Não apagar o D1. O catálogo, autenticação e histórico têm de ser preservados. Os arquivos de imagem ficam no Cloudflare R2, que não precisa ser migrado.

## Procedimento de ativação

1. Provisione um PostgreSQL (preferencialmente Neon) e guarde a `DATABASE_URL` em segredo. O Hyperdrive **não cria** o banco: ele conecta um banco PostgreSQL existente ao Worker.
2. Registre backup e bookmark do D1. Bloqueie gravações enquanto importar; confirme que não há escritores concorrentes.
3. Execute o importador em máquina confiável, com `DATABASE_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID` e `CONFIRM_D1_FREEZE=yes`: `npm run migrate:postgres`. Não registre credenciais nem dados pessoais em logs.
4. Confirme contagem e conteúdo de cada tabela e a integridade referencial. O script verifica contagens, mas é necessária auditoria semântica adicional.
5. Crie Hyperdrive com cache desativado para consultas de sessão/usuário. Via Wrangler: `npx wrangler hyperdrive create receitando-postgres --connection-string="$DATABASE_URL" --caching-disabled`.
6. Adicione ao `wrangler.jsonc` o binding real `"hyperdrive":[{"binding":"HYPERDRIVE","id":"ID_GERADO"}]` e configure `DATABASE_ENGINE=postgres` **somente no ambiente de homologação**. O D1 fica disponível para retorno.
7. Execute os testes em PostgreSQL, especialmente login, sessão, catálogo/FTS, CRUD de despensa, favoritos, interação social, moderação, recuperação de senha, rotas de imagens e WebSocket.
8. Faça cutover em manutenção controlada apenas quando todas as verificações estiverem aprovadas, com rollback pronto para o D1.

## Arquitetura

- Frontend Next.js + React sem mudança.
- Worker: `DATABASE_ENGINE=d1` preserva implementação existente; `postgres` usa driver `pg` e `env.HYPERDRIVE.connectionString`, com uma conexão por requisição e pooling no Hyperdrive.
- PostgreSQL: esquema gerado com base no DDL existente; FTS5 substituído por `to_tsvector('portuguese')` com índice GIN; códigos SQL D1 são compatibilizados temporariamente pelo adaptador.
- R2: continua armazenamento de imagens.
- Durable Objects: continuam com estado isolado de cada sala; não são migrados para PostgreSQL.

## Verificações executáveis

No backend, `npm run typecheck`, `npm test`, `npm run test:postgres`, `npm run dry-run`, `npm run test:ws`. Os testes unitários de tradução de SQL não substituem testes reais com um PostgreSQL provisionado. **Não publicar a versão com PostgreSQL na produção apenas porque a compilação passou.**

## Limitações conhecidas

- O D1 usa SQLite com semânticas próprias; PostgreSQL exige testar explicitamente busca textual, classificação, valores de data, coerção de tipos, conflitos e batch transacional.
- Migração feita com usuários ativos e novas escritas pode deixar tabelas inconsistentes. Por isso o importador exige confirmação explícita de congelamento.
- O cache Hyperdrive deve estar desativado inicialmente, inclusive para consultas de sessão, e otimizações de cache devem ser auditadas antes de liberar.
- O script copia registros das tabelas da aplicação, mas não substitui um backup do D1 nem garante, por si só, equivalência completa dos dados.
