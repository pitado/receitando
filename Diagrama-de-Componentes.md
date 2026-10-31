# Diagrama UML de Componentes — Receitando

**Visualização direta no GitHub:** o desenho UML aparece abaixo. Não é uma imagem estática; o diagrama é gerado a partir do código Mermaid desta página.

Next.js, Workers, Hyperdrive, Neon PostgreSQL, R2, Resend e Durable Objects.

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

**Editar em PlantUML:** [abrir o arquivo-fonte `receitando-diagrama-componentes.puml`](receitando-diagrama-componentes.puml).

**Base técnica:** [System Design](docs/system-design-fase4.md) · [schema PostgreSQL](backend/worker-prototype/migrations/postgres/0001_baseline.sql) · [índice de diagramas](DIAGRAMAS-EDITAVEIS.md).
