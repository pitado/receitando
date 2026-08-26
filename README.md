# Receitando

[![Frontend CI](https://github.com/pitado/receitando/actions/workflows/ci.yml/badge.svg)](https://github.com/pitado/receitando/actions/workflows/ci.yml)
[![API Worker CI](https://github.com/pitado/receitando/actions/workflows/api-worker-ci.yml/badge.svg)](https://github.com/pitado/receitando/actions/workflows/api-worker-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

O **Receitando** é uma aplicação web acadêmica que ajuda a descobrir receitas a partir dos ingredientes que a pessoa já possui.

O usuário pode informar ingredientes manualmente ou manter uma despensa vinculada à conta. O sistema normaliza esses itens, compara com o catálogo e ordena receitas por compatibilidade, mostrando o que já está disponível e o que ainda falta.

> Escopo formal: [`docs/escopo.md`](docs/escopo.md)  
> Funcionalidades implementadas: [`docs/funcionalidades.md`](docs/funcionalidades.md)  
> Índice da documentação: [`docs/README.md`](docs/README.md)

## Acesso

- **Site:** https://receitando.miguelpita.com.br
- **API:** https://api.receitando.miguelpita.com.br

## O que já está implementado

### Receitas e matching

- catálogo navegável;
- detalhe completo da receita;
- busca por ingredientes;
- normalização e aliases de ingredientes;
- percentual de compatibilidade;
- ingredientes encontrados, faltantes e opcionais;
- matching com até 40 ingredientes informados;
- matching diretamente pela despensa.

### Conta

- cadastro;
- login e logout;
- sessão persistente;
- perfil com nome, `@` e avatar;
- recuperação de senha por código enviado por e-mail;
- proteção contra força bruta/abuso em login e cadastro.

### Personalização e comunidade

- despensa persistente;
- quantidade e unidade opcionais;
- favoritos persistentes;
- gostei/não gostei;
- comentários;
- edição e exclusão apenas do próprio comentário;
- feed da home com receitas populares, comentários recentes e totais.

### Catálogo externo

- receitas do **Wikilivros em português**;
- imagens livres do **Wikimedia Commons**;
- importação automatizada/manual via GitHub Actions;
- procedência da receita;
- procedência, autor, página e licença da imagem;
- créditos exibidos no detalhe da receita.

## Arquitetura

```text
Navegador
   │
   ▼
Next.js + React
OpenNext / Cloudflare Worker
   │
   │ HTTP + JSON
   ▼
API Cloudflare Worker
   │
   ├── Cloudflare D1
   └── Resend
```

O frontend nunca acessa o banco diretamente.

A API atual fica em `backend/worker-prototype/`. Apesar do nome histórico do diretório, é essa implementação que está em produção.

### Entrypoint real da API

O `wrangler.jsonc` aponta para:

```text
src/auth-rate-limit-worker.ts
```

A cadeia atual é:

```text
auth-rate-limit-worker
        ↓
home-worker
        ↓
catalog64-worker
        ↓
social-worker
        ↓
profile-worker
        ↓
password-reset-worker
        ↓
pantry-worker
        ↓
index
```

Cada camada possui um grupo de rotas. Infraestrutura repetida de CORS, respostas JSON, leitura de token e contrato `Env` foi centralizada em `src/lib/worker-http.ts`.

Detalhes: [`docs/architecture.md`](docs/architecture.md).

## API — visão rápida

A documentação completa, com exemplos e contratos, está em [`docs/api.md`](docs/api.md).

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api/health` | healthcheck |
| `POST` | `/api/auth/register` | cadastro |
| `POST` | `/api/auth/login` | login |
| `GET` / `PATCH` | `/api/auth/me` | perfil |
| `POST` | `/api/auth/logout` | logout |
| `POST` | `/api/auth/forgot-password` | solicitar recuperação |
| `POST` | `/api/auth/verify-reset-code` | validar código |
| `POST` | `/api/auth/reset-password` | trocar senha |
| `GET` | `/api/sources` | fontes do catálogo |
| `GET` | `/api/ingredients` | ingredientes |
| `GET` | `/api/recipes` | catálogo |
| `GET` | `/api/recipes/:slug` | detalhe da receita |
| `POST` | `/api/recipes/match` | matching manual |
| `GET` | `/api/recipes/match/pantry` | matching pela despensa |
| `GET` / `POST` | `/api/pantry` | despensa |
| `DELETE` | `/api/pantry/:itemId` | remover item |
| `GET` / `POST` | `/api/favorites` | favoritos |
| `DELETE` | `/api/favorites/:recipeId` | remover favorito |
| `GET` | `/api/recipes/:recipeId/social` | resumo social |
| `PUT` / `DELETE` | `/api/recipes/:recipeId/vote` | voto |
| `GET` / `POST` | `/api/recipes/:recipeId/comments` | comentários |
| `PATCH` / `DELETE` | `/api/recipe-comments/:commentId` | comentário próprio |
| `GET` | `/api/home-feed` | feed da home |

**Rota canônica de detalhe:** `/api/recipes/:slug`. A implementação antiga `/api/recipes/slug/:slug` foi removida junto com outras rotas duplicadas de `index.ts`.

## Segurança

A implementação atual inclui:

- PBKDF2 para senhas;
- tokens de sessão aleatórios, com somente SHA-256 persistido no D1;
- queries parametrizadas com `.bind()`;
- autorização por usuário em despensa, favoritos, votos e comentários;
- resposta genérica na solicitação de recuperação de senha para evitar enumeração de e-mail;
- limite de tentativas no código de recuperação;
- invalidação das sessões após troca de senha;
- rate limiting de login por e-mail/IP e cadastro por IP;
- CORS restrito a origens configuradas;
- secrets fora do repositório.

Reporte responsável: [`SECURITY.md`](SECURITY.md).

> A migração de sessão para cookie `HttpOnly` está isolada nos PRs de segurança #99–#101, para permitir deploy gradual sem quebrar o frontend atual.

## Catálogo, imagens e licenças

O fluxo operacional usa exclusivamente:

- **Wikilivros em português** para receitas;
- **Wikimedia Commons** para imagens livres.

O importador atual fica em:

```text
backend/worker-prototype/scripts/import-wikibooks-v2.mjs
```

Ele descobre páginas, interpreta ingredientes/preparo, procura imagens, valida metadados/licenças, trata rate limits e grava no D1 em lotes.

Importadores experimentais substituídos foram removidos da árvore ativa. O histórico continua acessível pelo Git.

### Atribuição

A API retorna dois blocos independentes:

- `source`: procedência do texto/receita;
- `image`: URL, fonte, autor, página, licença, URL da licença e texto alternativo da imagem.

O frontend exibe esses créditos no detalhe quando disponíveis.

Documentação: [`docs/catalogo.md`](docs/catalogo.md).

## Banco de dados

Produção utiliza **Cloudflare D1**.

Migrations:

```text
backend/worker-prototype/migrations/
```

O schema inclui:

- usuários e sessões;
- ingredientes e aliases;
- receitas, ingredientes e tags;
- despensa;
- favoritos;
- recuperação de senha;
- perfil;
- votos e comentários;
- procedência de receitas/imagens;
- eventos de rate limiting.

A migration `0008b_prepare_catalog_v3b.sql` é uma etapa histórica intencional para preservar IDs/URLs e relações existentes durante uma expansão antiga do catálogo; ela está documentada em [`docs/database.md`](docs/database.md).

## Estrutura do repositório

```text
receitando/
├── frontend/                       aplicação Next.js
├── backend/
│   ├── worker-prototype/           API atual de produção
│   │   ├── migrations/             migrations do D1
│   │   ├── scripts/                importador operacional
│   │   ├── src/                    Workers e bibliotecas
│   │   └── tests/                  testes da API
│   ├── src/                        NestJS histórico
│   └── prisma/                     Prisma histórico
├── docs/                           documentação oficial
├── .github/                        CI, deploy, Dependabot e templates
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── README.md
```

O backend NestJS/Prisma diretamente em `backend/` é **histórico**: não recebe novas funcionalidades, não faz parte do deploy atual e não é tratado como componente de produção no CI.

Mapa detalhado: [`docs/estrutura-repositorio.md`](docs/estrutura-repositorio.md).

## Stack

### Frontend

- Next.js 16;
- React 19;
- TypeScript;
- App Router;
- OpenNext;
- Cloudflare Workers.

### API

- Cloudflare Workers;
- TypeScript;
- Wrangler;
- Cloudflare D1;
- Web Crypto API;
- Resend.

### Infraestrutura

- GitHub Actions;
- Cloudflare Workers;
- Cloudflare D1;
- Dependabot para frontend e API atuais.

## Desenvolvimento local

Pré-requisitos:

- Node.js 20.9+;
- npm 10+.

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

`frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8787
```

### API

```bash
cd backend/worker-prototype
npm ci
npm run migrate:local
npm run dev
```

Endereços padrão:

- frontend: `http://localhost:3000`;
- API: `http://localhost:8787`.

## Variáveis e secrets

| Variável | Componente | Tipo | Uso |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | frontend | pública | URL da API |
| `FRONTEND_URL` | API | configuração | origens aceitas no CORS |
| `EMAIL_FROM` | API | configuração | remetente do reset de senha |
| `RESEND_API_KEY` | API | **secret** | autenticação no Resend |
| `CLOUDFLARE_API_TOKEN` | Actions | **secret** | deploy/migrations |
| `CLOUDFLARE_ACCOUNT_ID` | Actions | **secret operacional** | conta Cloudflare |

`.env.example` contém apenas placeholders/valores locais seguros.

## Qualidade e testes

### Frontend

A suíte usa **Vitest + React Testing Library + jsdom + jest-dom**.

```bash
cd frontend
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

Os testes cobrem serviços HTTP, autenticação no cliente, armazenamento da sessão atual, catálogo, matching, despensa, favoritos, perfil, recuperação, social/home, normalização, formatação e componentes compartilhados.

### API Worker

```bash
cd backend/worker-prototype
npm run typecheck
npm test
npm run dry-run
```

A suíte combina testes de regras puras com testes que executam `fetch()` dos Workers reais usando um D1 simulado. Entre os fluxos cobertos estão cadastro/sessão, autorização, despensa, favoritos, perfil, recuperação sem enumeração, catálogo, matching, atribuição de imagem, social e home feed.

CI/deploy falham se as validações obrigatórias falharem.

## Deploy

Frontend e API possuem workflows separados. A importação do catálogo também é independente do deploy.

Guia operacional: [`docs/deploy.md`](docs/deploy.md).

## Dependabot

A configuração atual monitora somente:

- `/frontend`;
- `/backend/worker-prototype`.

Atualizações `minor`/`patch` são agrupadas. Majors são tratadas como migrações planejadas, não como merge automático.

## Contribuição

Regras de branches, testes, migrations, documentação e pull requests: [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Licença

O código original do Receitando é disponibilizado sob **MIT License**. Consulte [`LICENSE`](LICENSE).

A MIT não altera as licenças das receitas e imagens importadas. Conteúdo do Wikilivros/Wikimedia continua sujeito às condições e atribuições informadas nas respectivas fontes.

## Documentação

- [`docs/README.md`](docs/README.md) — índice;
- [`docs/escopo.md`](docs/escopo.md) — escopo acadêmico;
- [`docs/funcionalidades.md`](docs/funcionalidades.md) — estado implementado;
- [`docs/architecture.md`](docs/architecture.md) — arquitetura;
- [`docs/api.md`](docs/api.md) — contrato completo da API;
- [`docs/database.md`](docs/database.md) — D1 e migrations;
- [`docs/catalogo.md`](docs/catalogo.md) — receitas, imagens e licenças;
- [`docs/deploy.md`](docs/deploy.md) — CI/deploy/operação;
- [`docs/estrutura-repositorio.md`](docs/estrutura-repositorio.md) — estrutura do código;
- [`frontend/README.md`](frontend/README.md) — frontend;
- [`backend/worker-prototype/README.md`](backend/worker-prototype/README.md) — API atual;
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribuição;
- [`SECURITY.md`](SECURITY.md) — segurança.

---

Projeto acadêmico em evolução, com produção baseada em **Next.js + Cloudflare Workers + Cloudflare D1 + GitHub Actions**.
