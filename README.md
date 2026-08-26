# Receitando

[![Frontend CI](https://github.com/pitado/receitando/actions/workflows/ci.yml/badge.svg)](https://github.com/pitado/receitando/actions/workflows/ci.yml)
[![API Worker CI](https://github.com/pitado/receitando/actions/workflows/api-worker-ci.yml/badge.svg)](https://github.com/pitado/receitando/actions/workflows/api-worker-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

O **Receitando** é uma aplicação web acadêmica que ajuda a descobrir receitas a partir dos ingredientes que a pessoa já possui.

O usuário pode informar ingredientes manualmente ou manter uma despensa vinculada à conta. O sistema resolve variações para ingredientes canônicos, compara esses itens com o catálogo e ordena receitas por compatibilidade, mostrando o que já está disponível e o que ainda falta.

> Escopo formal: [`docs/escopo.md`](docs/escopo.md)  
> Funcionalidades implementadas: [`docs/funcionalidades.md`](docs/funcionalidades.md)  
> Índice da documentação: [`docs/README.md`](docs/README.md)

## Acesso

- **Site:** https://receitando.miguelpita.com.br
- **API:** https://api.receitando.miguelpita.com.br

## O que já está implementado

### Receitas, busca e matching

- catálogo navegável e detalhe completo;
- busca textual indexada com SQLite FTS5;
- catálogo canônico de ingredientes e aliases;
- normalização de variações como plural e descrições comuns de preparo;
- equivalência por IDs canônicos, sem substring como regra de matching;
- ingredientes básicos (`is_staple`) que não penalizam a compatibilidade;
- percentual de compatibilidade;
- ingredientes encontrados, faltantes, opcionais e básicos;
- matching com até 40 ingredientes informados;
- matching diretamente pela despensa;
- regra atual de matching booleano (`tem` / `não tem`), documentada na interface e no escopo.

### Conta e segurança

- cadastro;
- login e logout;
- sessão persistente;
- perfil com nome, `@` e avatar;
- recuperação de senha por código enviado por e-mail;
- PBKDF2 via Web Crypto para senhas;
- SHA-256 para tokens e chaves de rate limiting armazenadas;
- rate limiting de login, cadastro e solicitação de recuperação de senha;
- resposta genérica no reset para evitar enumeração de contas.

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
- imagens com licença livre do **Wikimedia Commons**;
- importação manual via GitHub Actions;
- pós-processamento para canonicalização de ingredientes;
- procedência da receita;
- procedência, autor, página e licença da imagem;
- créditos exibidos no detalhe da receita;
- conteúdo culinário convertido para texto, sem renderização de HTML bruto da fonte externa.

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

A API atual fica em `backend/worker-prototype/`. Apesar do nome histórico do diretório, essa é a única implementação de backend mantida na árvore principal.

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

Infraestrutura compartilhada de HTTP/CORS/autenticação fica em `src/lib/worker-http.ts`; normalização e regras puras de matching ficam em `src/lib/recipe-utils.ts`.

Detalhes: [`docs/architecture.md`](docs/architecture.md).

## API — visão rápida

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
| `GET` | `/api/ingredients` | ingredientes canônicos |
| `GET` | `/api/recipes` | catálogo e busca FTS5 |
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

Documentação completa: [`docs/api.md`](docs/api.md).

## Regra de matching

O fluxo não compara strings com `LIKE '%ingrediente%'`.

```text
texto informado/importado
        ↓
normalização
        ↓
nome completo + forma canônica conservadora
        ↓
ingredients.normalized_name / ingredient_aliases.normalized_alias
        ↓
ingredient_id canônico
        ↓
matching por presença
```

Exemplo esperado:

```text
cebola / cebolas / cebolas picadas / cebola média
                         ↓
                       cebola
```

Compostos semanticamente diferentes permanecem separados: `óleo` não equivale automaticamente a `óleo de gergelim torrado`, e `açúcar` não equivale a `açúcar de confeiteiro`.

Ingredientes marcados `is_staple`, como água, sal, pimenta e óleo genérico, não entram no denominador da compatibilidade nem na lista principal de faltantes.

**Quantidade e unidade ainda não participam do cálculo.** Nesta versão, possuir `1 ovo` significa possuir o ingrediente `ovo`, mesmo que a receita solicite uma quantidade maior. Essa limitação está explícita no escopo e na tela de combinações.

## Segurança

A implementação atual inclui:

- PBKDF2 com salt aleatório para senhas;
- tokens de sessão aleatórios, com somente SHA-256 persistido no D1;
- queries de requisição parametrizadas com `.bind()`;
- autorização por usuário em despensa, favoritos, votos e comentários;
- resposta genérica na recuperação de senha;
- limite de tentativas no código de recuperação;
- invalidação das sessões após troca de senha;
- rate limiting por e-mail/IP em login e solicitação de recuperação e por IP em cadastro;
- CORS restrito a origens configuradas;
- secrets fora do repositório;
- conteúdo externo culinário convertido para texto e renderizado pelo React como texto, sem HTML bruto do Wikilivros.

Reporte responsável: [`SECURITY.md`](SECURITY.md).

> A migração de sessão para cookie `HttpOnly` está isolada nos PRs de segurança #99–#101, para permitir deploy gradual sem quebrar o frontend atual.

## Catálogo, imagens e licenças

O fluxo operacional usa exclusivamente:

- **Wikilivros em português** para receitas;
- **Wikimedia Commons** para imagens livres.

Scripts ativos:

```text
backend/worker-prototype/scripts/import-wikibooks-v2.mjs
backend/worker-prototype/scripts/canonicalize-ingredients.mjs
```

A sequência do workflow importa as receitas e depois consolida variações de ingredientes, preservando aliases e identificando staples.

Importadores experimentais substituídos foram removidos da árvore ativa. O histórico continua acessível pelo Git.

Documentação: [`docs/catalogo.md`](docs/catalogo.md).

## Banco de dados

Produção utiliza **Cloudflare D1**.

Migrations:

```text
backend/worker-prototype/migrations/
```

O schema inclui usuários/sessões, catálogo canônico de ingredientes, aliases, receitas, despensa, favoritos, recuperação de senha, comunidade, atribuição de conteúdo, rate limiting e busca FTS5.

A migration `0015_matching_search_hardening.sql` adiciona `is_staple`, índices para padrões frequentes de acesso e a tabela virtual `recipe_search` com triggers de sincronização.

Chaves estrangeiras com `CASCADE`/`RESTRICT` protegem a integridade relacional. Detalhes: [`docs/database.md`](docs/database.md).

## Estrutura do repositório

```text
receitando/
├── frontend/                       aplicação Next.js
├── backend/
│   ├── README.md
│   └── worker-prototype/           API atual de produção
│       ├── migrations/             migrations do D1
│       ├── scripts/                importação/canonicalização
│       ├── src/                    Workers e bibliotecas
│       └── tests/                  testes da API
├── docs/                           documentação oficial
├── .github/                        CI, deploy, Dependabot e templates
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── README.md
```

A implementação antiga em NestJS + Prisma + PostgreSQL foi retirada da árvore principal e preservada na branch `legacy/nest-prisma`.

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

```bash
cd frontend
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

A suíte usa Vitest + React Testing Library + jsdom + jest-dom.

### API Worker

```bash
cd backend/worker-prototype
npm run typecheck
npm test
npm run dry-run
```

A suíte combina testes de regras puras com testes de `fetch()` dos Workers usando D1 simulado. Matching canônico, staples, FTS5, autenticação, rate limiting e rotas críticas possuem testes de regressão.

CI/deploy falham se as validações obrigatórias falharem.

## Deploy

Frontend e API possuem workflows separados. A importação do catálogo também é independente do deploy.

Guia operacional: [`docs/deploy.md`](docs/deploy.md).

## Dependabot

A configuração atual monitora somente:

- `/frontend`;
- `/backend/worker-prototype`.

## Contribuição e licença

Regras de branches, testes, migrations, documentação e PRs: [`CONTRIBUTING.md`](CONTRIBUTING.md).

O código original do Receitando é disponibilizado sob **MIT License**. A MIT não altera as licenças das receitas e imagens importadas.

## Documentação

- [`docs/README.md`](docs/README.md) — índice;
- [`docs/escopo.md`](docs/escopo.md) — escopo acadêmico;
- [`docs/funcionalidades.md`](docs/funcionalidades.md) — estado implementado;
- [`docs/architecture.md`](docs/architecture.md) — arquitetura;
- [`docs/api.md`](docs/api.md) — contrato completo da API;
- [`docs/database.md`](docs/database.md) — D1, índices e migrations;
- [`docs/catalogo.md`](docs/catalogo.md) — receitas, imagens e licenças;
- [`docs/testes.md`](docs/testes.md) — estratégia de testes;
- [`docs/deploy.md`](docs/deploy.md) — CI/deploy/operação;
- [`docs/estrutura-repositorio.md`](docs/estrutura-repositorio.md) — estrutura do código;
- [`frontend/README.md`](frontend/README.md) — frontend;
- [`backend/worker-prototype/README.md`](backend/worker-prototype/README.md) — API atual;
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribuição;
- [`SECURITY.md`](SECURITY.md) — segurança.

---

Projeto acadêmico em evolução, com produção baseada em **Next.js + Cloudflare Workers + Cloudflare D1 + GitHub Actions**.
