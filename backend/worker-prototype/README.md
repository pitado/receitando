# Backend Receitando — Cloudflare Workers + Neon PostgreSQL

O serviço de API `round-mouse-8bbd` utiliza **Cloudflare Workers/TypeScript**. Dados relacionais ficam no **Neon PostgreSQL**, acessados via **Cloudflare Hyperdrive** e driver `pg`. Imagens ficam no **R2**; salas em tempo real utilizam **Durable Objects**.

## Organização
- `src/session-cookie-worker.ts` — entrada HTTP, cookies, origem e CORS.
- `src/app-router.ts` — roteamento REST e salas.
- `src/lib/postgres-adapter.ts` — conexão PostgreSQL e camada de compatibilidade de consultas da API.
- `src/cooking-room.ts` — sala WebSocket com sincronização de estado.
- `migrations/postgres/` — esquema e atualizações SQL PostgreSQL versionadas.
- `scripts/test-postgres-schema.mjs` — integração de banco isolado.
- `scripts/test-cooking-rooms.mjs` — verificação local de WebSocket.

## Verificação
```bash
npm ci
npm run typecheck
npm test
npm run test:postgres
npm run test:ws
npm run dry-run
```
A integração completa PostgreSQL usa `POSTGRES_TEST_URL` direcionado a uma instância **local temporária**, nunca à produção.

## Produção
O arquivo [wrangler.jsonc](wrangler.jsonc) define `DATABASE_ENGINE=postgres`, `HYPERDRIVE`, `RECIPE_IMAGES` e `COOKING_ROOMS`. Credenciais reais não pertencem ao repositório; migrações de produção exigem revisão antes de aplicar. O frontend pode chamar a API por HTTPS, mas não recebe string de conexão SQL.

## Estrutura acadêmica
[System Design](../../docs/system-design-fase4.md) · [Arquitetura](../../docs/architecture.md) · [Schema](migrations/postgres/0001_baseline.sql) · [WebSocket](../../docs/receitando-juntos.md) · [Teste PostgreSQL](../../tests/load/README.md).
