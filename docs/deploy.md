# Deploy e operação — Receitando

## Componentes
- **Frontend:** Next.js/OpenNext em Cloudflare Workers.
- **API:** Cloudflare Worker `round-mouse-8bbd`, domínio `api.receitando.miguelpita.com.br`.
- **Banco:** Neon PostgreSQL 17 por binding Cloudflare `HYPERDRIVE`, driver `pg`.
- **Arquivos:** bucket Cloudflare R2 `receitando-recipe-images`.
- **WebSocket:** Durable Object `CookingRoom`.
- **Mensagens:** Resend.

## Ambiente e segurança
Variável `DATABASE_ENGINE=postgres`. Conexão PostgreSQL por Hyperdrive; tokens, credenciais e chaves privadas ficam no gerenciador de segredos. Nunca publicar strings reais no Git. Origem de frontend é controlada pela configuração de CORS.

## Entrega contínua
Os workflows de frontend e de API validam TypeScript, testes e deploy. A API inclui integração com Postgres local de CI e teste WebSocket; conferir os resultados antes de publicar. Migrações de produção **não** são executadas implicitamente nos comandos de deploy — aplicar `migrations/postgres/` mediante revisão.

## Cuidados com carga
Testar em **staging isolado**, com Postgres separado e dados sintéticos. Observar latência, erros, CPU/conexões/IO no Neon, capacidade Hyperdrive, custo e timeouts; a branch de produção não deve receber fixture nem teste de estresse.

[System Design](system-design-fase4.md) · [Schema](../backend/worker-prototype/migrations/postgres/0001_baseline.sql) · [Evidência SQL](../tests/load/README.md).
