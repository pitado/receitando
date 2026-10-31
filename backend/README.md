# Backend Receitando

O backend principal reside em [worker-prototype](worker-prototype/README.md): API em **Cloudflare Workers**, persistência **Neon PostgreSQL via Hyperdrive**, R2 para arquivos e Durable Objects para comunicação WebSocket.

O código Node/TypeScript mantém autenticação, catálogo, matching, despensa, favoritos, comunidade, moderação e Receitando Juntos. O ambiente de produção não é local nem deve receber dados de benchmark.

[System Design](../docs/system-design-fase4.md) · [Banco](../docs/database.md) · [Testes](../docs/testes.md).
