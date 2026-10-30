# Componentes da arquitetura

O diagrama mostra por onde passam as requisições do frontend e quais serviços a API utiliza. Incluímos também as salas compartilhadas do Receitando Juntos.

```mermaid
flowchart LR
    U["Usuário / navegador"] -->|HTTPS| F["Next.js + React<br/>OpenNext / Cloudflare Worker"]
    F --> S["services/ e types/<br/>HTTP + TypeScript"]
    S -->|JSON, cookie HttpOnly| SC["session-cookie-worker<br/>CORS e CSRF"]
    SC --> AR["app-router"]
    subgraph API["API de produção - Cloudflare Worker"]
       AR --> CAT["catalog64 e catalog-v2<br/>Catálogo, matching e favoritos"]
       AR --> USER["pantry, profile e auth<br/>Despensa e autenticação"]
       AR --> SOCIAL["social e adaptation<br/>Comentários, votos, adaptação"]
       AR --> SUB["recipe-submission-worker<br/>Envio e moderação"]
       AR --> ROOM["Rotas de salas<br/>Receitando Juntos"]
    end
    CAT --> D1[("Cloudflare D1<br/>SQLite")]
    USER --> D1
    SOCIAL --> D1
    SUB --> D1
    SUB --> R2[("Cloudflare R2<br/>Imagens")]
    USER --> EMAIL["Resend<br/>Recuperação de senha"]
    ROOM --> DO["Durable Object<br/>CookingRoom / WebSocket"]
    F -. "Conexão WebSocket pelo roteamento da API" .-> ROOM
    EXT["Wikilivros / Wikimedia Commons"] --> CI["GitHub Actions<br/>Importação, normalização"]
    CI --> D1
    CI --> R2
    classDef service fill:#e8f2ff,stroke:#5884bb,color:#1f2937
    classDef database fill:#fff2df,stroke:#c08c45,color:#1f2937
    class U,F,S,SC,AR,CAT,USER,SOCIAL,SUB,ROOM,CI service
    class D1,R2 database
```

A criação das salas e o encaminhamento do WebSocket estão implementados no backend. A validação de sincronização entre dispositivos ainda é uma etapa de teste. O fluxo das mensagens está detalhado em [Receitando Juntos — WebSocket](../websocket-receitando-juntos.md).

**Arquivo editável:** [abrir o arquivo-fonte `.drawio`](../../receitando-diagrama-componentes.drawio). O GitHub exibe o XML quando você abre um `.drawio` diretamente; por isso esta página fornece a visualização sem precisar instalar ou baixar nada.

[Voltar ao índice dos diagramas](../../DIAGRAMAS-EDITAVEIS.md)
