# Componentes da arquitetura

Visão de frontend, API, Workers, banco D1, bucket R2, autenticação e importação.

**Prévia visual gerada pelo GitHub usando Mermaid:**

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
    end
    CAT --> D1[("Cloudflare D1<br/>SQLite")]
    USER --> D1
    SOCIAL --> D1
    SUB --> D1
    SUB --> R2[("Cloudflare R2<br/>Imagens")]
    USER --> EMAIL["Resend<br/>Recuperação de senha"]
    EXT["Wikilivros / Wikimedia Commons"] --> CI["GitHub Actions<br/>Importação, normalização"]
    CI --> D1
    CI --> R2
    classDef service fill:#e8f2ff,stroke:#5884bb,color:#1f2937
    classDef database fill:#fff2df,stroke:#c08c45,color:#1f2937
    class U,F,S,SC,AR,CAT,USER,SOCIAL,SUB,CI service
    class D1,R2 database
```

**Para editar as caixas e conexões:** [abrir o arquivo-fonte `.drawio`](../../receitando-diagrama-componentes.drawio). O GitHub exibe o XML quando você abre um `.drawio` diretamente; por isso esta página fornece a visualização sem precisar instalar ou baixar nada.

[Voltar ao índice dos diagramas](../../DIAGRAMAS-EDITAVEIS.md)
