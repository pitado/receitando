# Changelog técnico

Este registro distingue a **infraestrutura atual** de decisões históricas. O Git mantém o histórico integral de commits, arquivos e migrações anteriores.

## 2026-10-31 — Arquitetura PostgreSQL e entrega da Fase 4

- **Neon PostgreSQL 17** é o banco relacional em produção, com `pg` conectado pelo **Cloudflare Hyperdrive**.
- Cloudflare Workers processam a API REST stateless; R2 mantém fotos; Durable Objects coordenam salas WebSocket.
- Schema e seeds válidos para novas instalações ficam em `backend/worker-prototype/migrations/postgres/`.
- Migrations SQLite e ferramentas operacionais antigas foram removidas da árvore atual após a troca do banco. O histórico anterior permanece nos commits do Git.
- Documentação, README, diagramas e workflows passam a apontar somente para infraestrutura em uso.
- O adaptador de PostgreSQL ainda converte sintaxes de consultas legadas **dentro do código** por compatibilidade; não implica a existência de outro banco.
- A [Fase 4 — System Design](docs/system-design-fase4.md) documenta estratégia para 1 milhão de escritas/2 milhões de leituras, REST stateless, WebSocket e integração hipotética de pagamento.
- Testes HTTP reais com Worker + Hyperdrive + Neon isolado e evidência SQL foram registrados em [tests/load/README.md](tests/load/README.md). Os testes não certificam 3 milhões de requisições HTTP sustentadas.

## 2026-08 — Consolidação do backend

- Centralizados CORS, cookies, autenticação e roteamento no entrypoint `session-cookie-worker.ts` e no `app-router.ts`.
- Consolidado o matching e as rotas de catálogo; removidas implementações duplicadas.
- Resposta de recuperação de senha padronizada, sem enumerar contas.
- Contratos de atribuição de fotos e testes do frontend/backend ampliados.

### Histórico de migrations antigas (não operacionais)

Existiram migrations SQLite denominadas `0008b_prepare_catalog_v3b.sql`, `0009_seed_catalog_v3b.sql` e arquivos diferentes com o prefixo `0013`. Esses artefatos **não** fazem parte do sistema de migrações PostgreSQL atual. São consultáveis no histórico do Git apenas para auditoria e não devem ser executados nem usados como base para novas migrações.

Novas alterações de schema devem seguir as migrations `postgres/0001_baseline.sql`, `postgres/0002_external_recipe_references.sql` e `postgres/0003_seed_curated_recipes.sql`, sem renumerar arquivos aplicados.
