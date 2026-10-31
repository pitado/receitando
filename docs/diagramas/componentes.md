# Diagrama de componentes — Receitando

```mermaid
flowchart TB
  U["Usuário web/mobile — PWA"] --> FRONT["Next.js / Cloudflare Worker"]
  FRONT -->|"HTTPS REST / JSON"| API["API Worker stateless"]
  API --> AUTH["Autenticação, perfil e sessão"]
  API --> CAT["Receitas, busca e despensa"]
  API --> COM["Comunidade, moderação"]
  AUTH --> HD["Hyperdrive"]
  CAT --> HD
  COM --> HD
  HD --> PG[("Neon PostgreSQL 17")]
  COM --> R2[("Cloudflare R2 — imagens")]
  AUTH --> MAIL["Resend — e-mails"]
  FRONT <-->|"WebSocket WSS"| ROOM["Durable Objects — CookingRoom"]
  API --> ROOM
```

O Worker REST é stateless; cookies seguros identificam sessões persistidas no PostgreSQL. O estado por sala WebSocket é independente e coordenado por um Durable Object. Imagens ficam no R2, não no banco relacional.

[System Design](../system-design-fase4.md) · [Schema PostgreSQL](../../backend/worker-prototype/migrations/postgres/0001_baseline.sql) · [WebSocket](../receitando-juntos.md).
