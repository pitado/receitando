# Estrutura do repositório Receitando

- `frontend/`: frontend Next.js 16 + React 19, páginas, componentes, serviços e testes.
- `backend/worker-prototype/src/`: API REST em Workers, autenticação, catálogo, despensa, comunidade e WebSocket.
- `backend/worker-prototype/migrations/postgres/`: schema e alterações SQL PostgreSQL.
- `backend/worker-prototype/tests/`: testes da API e consultas.
- `backend/worker-prototype/scripts/`: integração PostgreSQL, WebSocket e referências externas.
- `tests/load/`: metodologia e testes de escalabilidade.
- `docs/`: documentação acadêmica, contratos, arquitetura, banco, segurança e operação.
- `.github/workflows/`: CI e deploy do frontend e backend.

**Infraestrutura:** API e frontend na Cloudflare; PostgreSQL no Neon via Hyperdrive, R2 para arquivos e Durable Objects para salas.

[README](../README.md) · [System Design](system-design-fase4.md).
