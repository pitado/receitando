# Arquitetura do Receitando

## Visão geral

A produção atual do Receitando usa **Cloudflare Workers** tanto no frontend quanto na API. O frontend é uma aplicação Next.js compilada com OpenNext; a API é um Worker separado com persistência em Cloudflare D1.

```mermaid
flowchart TB
    U[Usuário / navegador]
    F[Next.js + React<br/>OpenNext / Cloudflare Worker]
    A[API<br/>Cloudflare Worker]
    D[(Cloudflare D1)]
    E[Resend]
    W[Wikilivros / Wikimedia Commons]

    U --> F
    F -->|HTTP + JSON| A
    A --> D
    A -->|recuperação de senha| E
    W -->|importação controlada| D
```

O frontend nunca acessa o banco diretamente. Estado persistente passa pela API. O catálogo externo é importado por scripts e workflows separados da aplicação em produção.

## Componentes

### Frontend

Diretório: `frontend/`

Responsabilidades principais:

- navegação e layout;
- autenticação no cliente;
- catálogo e detalhes de receitas;
- experiência de matching em `/combinar`;
- despensa e favoritos;
- perfil do usuário;
- recuperação de senha;
- interação social nas receitas;
- estados de loading, erro e 404.

A camada em `frontend/src/services/` concentra as chamadas HTTP para evitar espalhar detalhes da API pelos componentes visuais.

### API

Diretório: `backend/worker-prototype/`

Apesar do nome histórico, esta é a API usada pela arquitetura atual.

O ponto de entrada configurado no Wrangler é `src/home-worker.ts`. A implementação é dividida em Workers encadeados:

```text
home-worker
   ↓
catalog64-worker
   ↓
social-worker
   ↓
profile-worker
   ↓
password-reset-validation-worker
   ↓
password-reset-worker
   ↓
pantry-worker
   ↓
index
```

Cada camada atende um grupo de rotas e encaminha o restante para a próxima.

Áreas principais:

- `home-worker`: feed da home;
- `catalog64-worker`: fontes do catálogo, receitas, ingredientes e matching;
- `social-worker`: votos e comentários;
- `profile-worker`: perfil autenticado;
- `password-reset-validation-worker`: validação do fluxo de recuperação;
- `password-reset-worker`: recuperação de senha e integração com Resend;
- `pantry-worker`: despensa e favoritos;
- `index`: autenticação e rotas-base.

O `tsconfig.json` da API valida todo `src/**/*.ts`, alinhando o typecheck ao código realmente alcançado pelo entrypoint de produção.

## Persistência

O banco de produção é **Cloudflare D1**.

As migrations ficam em:

```text
backend/worker-prototype/migrations/
```

Elas definem contas, sessões, catálogo, aliases de ingredientes, despensa, favoritos, recuperação de senha, perfis, votos, comentários e metadados de fontes e imagens externas.

A API usa SQL preparado diretamente pela API do D1.

## Autenticação

O login cria um token aleatório de sessão. O cliente recebe o token, enquanto o banco armazena somente seu hash.

Requisições autenticadas usam:

```text
Authorization: Bearer <token>
```

Senhas são derivadas com PBKDF2 usando Web Crypto. Recuperações de senha usam códigos temporários e tokens que também são armazenados de forma derivada/hash.

## Matching

O fluxo principal é:

```mermaid
sequenceDiagram
    actor Usuario as Usuário
    participant Web as Frontend
    participant API as API Worker
    participant DB as D1

    Usuario->>Web: informa ingredientes ou usa a despensa
    Web->>API: POST /api/recipes/match ou GET /api/recipes/match/pantry
    API->>DB: resolve ingredientes e aliases
    API->>DB: busca receitas candidatas
    DB-->>API: receitas + relações
    API->>API: calcula compatibilidade
    API-->>Web: resultados ordenados
    Web-->>Usuario: mostra o que combina e o que falta
```

O cálculo principal considera ingredientes obrigatórios:

```text
compatibilidade = encontrados / obrigatórios × 100
```

O motor também usa aliases normalizados para aproximar variações conhecidas de nomes de ingredientes.

## Catálogo externo

O schema suporta proveniência de receitas por meio de campos de origem, identidade externa, licença e metadados de imagem.

A estratégia atual de catálogo utiliza:

- **Wikilivros em português** para conteúdo das receitas;
- **Wikimedia Commons** para imagens livres.

O script operacional é `backend/worker-prototype/scripts/import-wikibooks-v2.mjs`, executado manualmente pelo workflow `import-wikibooks.yml`. A importação valida a estrutura das receitas, associa imagens compatíveis, registra metadados de origem/licença e grava os resultados no D1.

Esse fluxo é separado da experiência principal da aplicação: usuários acessam apenas o conteúdo já persistido no D1, sem depender de chamadas ao MediaWiki durante a navegação.

## Deploy e CI

```mermaid
flowchart LR
    G[GitHub main]
    CI[GitHub Actions]
    FW[Frontend Worker]
    AW[API Worker]
    D1[(Cloudflare D1)]
    WM[Wikilivros / Commons]

    G --> CI
    CI -->|lint + typecheck + build| FW
    CI -->|typecheck + dry-run| ADEP[Deploy da API]
    ADEP -->|migrations| D1
    ADEP -->|deploy| AW
    WM -->|workflow manual de importação| CI
    CI -->|catálogo validado| D1
```

O frontend possui CI e deploy automatizados para mudanças relevantes. O deploy do frontend repete lint, typecheck e build antes da publicação.

A API possui CI separado e um workflow de produção que executa typecheck, dry-run, migrations remotas e deploy, nessa ordem. Assim, a validação do bundle acontece antes de alterar o banco remoto.

Credenciais da Cloudflare e outros valores secretos ficam em GitHub Secrets ou secrets do ambiente, nunca na documentação.

## Desenvolvimento local

| Componente | Endereço padrão |
| --- | --- |
| Frontend | `http://localhost:3000` |
| API Worker | `http://localhost:8787` |
| D1 | banco local gerenciado pelo Wrangler |

A implementação antiga em `backend/` usa NestJS, Prisma e PostgreSQL e é mantida apenas como referência histórica; ela não representa a infraestrutura de produção atual.

## Documentação relacionada

- [`escopo.md`](escopo.md) — definição funcional e acadêmica do projeto;
- [`funcionalidades.md`](funcionalidades.md) — funcionalidades implementadas;
- [`api.md`](api.md) — rotas da API;
- [`database.md`](database.md) — modelo de dados atual;
- [`catalogo.md`](catalogo.md) — origem/importação do catálogo;
- [`deploy.md`](deploy.md) — CI, deploy e operação.
