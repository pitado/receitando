# Banco de dados — Neon PostgreSQL 17

A persistência relacional do Receitando é **Neon PostgreSQL 17**, acessada pela API em Cloudflare Workers através do **Cloudflare Hyperdrive**. O cliente web não acessa o banco diretamente. Fotos são salvas no R2; o PostgreSQL mantém metadados.

## Fonte de verdade
- [Schema PostgreSQL](../backend/worker-prototype/migrations/postgres/0001_baseline.sql).
- [Referências externas](../backend/worker-prototype/migrations/postgres/0002_external_recipe_references.sql).
- [Receitas autorais iniciais](../backend/worker-prototype/migrations/postgres/0003_seed_curated_recipes.sql).

## Modelo e consultas
O esquema abrange contas, sessões, recuperação de senha, receitas, ingredientes/aliases, itens de despensa, favoritos, tags, comentários, avaliações, envios, moderação e controle de acesso. Chaves primárias, estrangeiras, unicidade e índices preservam consistência. A busca textual é implementada com capacidades full-text do PostgreSQL.

O backend encapsula o cliente `pg` e a compatibilidade de consultas existentes em `src/lib/postgres-adapter.ts`. As consultas usam parâmetros vinculados e transações quando necessário. Não concatenar entrada de usuário em SQL.

## Operação e capacidade
- Auditar consultas lentas com `EXPLAIN (ANALYZE, BUFFERS)`, p95/p99, CPU, I/O e locks.
- Utilizar paginação, índices B-tree/full-text, controles de conexão e revisão de cache.
- Provisionar recursos Neon adequados à janela de carga; o Worker poder escalar horizontalmente não significa que o banco escale automaticamente.
- Executar migrações versionadas com revisão e teste em instâncias isoladas, sem fixtures na produção.
- Manter segredos no gerenciador de ambientes e backups/recuperação verificados.

**Evidência acadêmica de carga SQL:** em uma branch Neon isolada foram comprovadas 1.000.000 de gravações e 2.000.000 de buscas indexadas em dados sintéticos. [Metodologia e limites](../tests/load/README.md).

[System Design](system-design-fase4.md) · [DER](diagramas/der.md) · [API](api.md).
