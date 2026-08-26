# Estrutura do repositório

Este documento explica o papel das partes principais do Receitando e mantém a árvore principal alinhada à arquitetura realmente usada em produção.

## Visão geral

```text
receitando/
├── .github/
│   ├── ISSUE_TEMPLATE/             templates de bugs e melhorias
│   ├── dependabot.yml              atualizações dos componentes ativos
│   ├── pull_request_template.md    checklist padrão de PR
│   └── workflows/                  CI, deploy e importação de receitas
├── backend/
│   ├── README.md
│   └── worker-prototype/           API atual de produção
│       ├── migrations/             histórico versionado do Cloudflare D1
│       ├── scripts/                importador atual do Wikilivros/Commons
│       ├── src/                    implementação da API Worker
│       └── tests/                  testes automatizados da API
├── docs/                           documentação funcional e técnica
├── frontend/                       aplicação Next.js
├── CONTRIBUTING.md                 guia de contribuição
├── SECURITY.md                     política de segurança
├── LICENSE                         licença MIT do código original
├── CHANGELOG.md                    mudanças relevantes
├── README.md                       visão geral do projeto
└── .env.example                    referência de configuração sem secrets reais
```

## `frontend/`

É a aplicação web utilizada pelos usuários, construída com Next.js, React e TypeScript e publicada em Cloudflare Workers por meio do OpenNext.

Responsabilidades principais:

- navegação e interface;
- catálogo e detalhes de receitas;
- matching por ingredientes;
- despensa e favoritos;
- conta, perfil e recuperação de senha;
- comentários e avaliações;
- consumo da API.

Mais detalhes em [`../frontend/README.md`](../frontend/README.md).

## `backend/worker-prototype/`

Apesar do nome histórico, esta é a **API atual de produção**.

O entrypoint efetivamente publicado é definido em `wrangler.jsonc` e atualmente é:

```text
src/auth-rate-limit-worker.ts
```

A API é organizada em uma cadeia de camadas:

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

Responsabilidades:

- `auth-rate-limit-worker.ts`: proteção contra abuso de login, cadastro e solicitação de recuperação de senha;
- `home-worker.ts`: feed da home;
- `catalog64-worker.ts`: fontes, ingredientes, catálogo, detalhe por slug, busca FTS5 e matching;
- `social-worker.ts`: votos e comentários;
- `profile-worker.ts`: consulta e atualização de perfil;
- `password-reset-worker.ts`: recuperação de senha e Resend;
- `pantry-worker.ts`: despensa;
- `index.ts`: cadastro, login, sessão, logout, healthcheck e fallback final;
- `lib/worker-http.ts`: helpers HTTP/CORS/autenticação compartilhados;
- `lib/recipe-utils.ts`: normalização canônica e regras do matching.

Rotas de catálogo/matching que eram duplicadas em `index.ts` foram removidas. A implementação canônica dessas rotas é `catalog64-worker.ts`.

## Testes da API

A suíte fica em `backend/worker-prototype/tests/` e é executada com:

```bash
npm test
```

Ela cobre matching, normalização de ingredientes, segurança, rate limiting e rotas críticas do Worker.

## Catálogo e scripts

O único importador operacional mantido na árvore atual é:

```text
backend/worker-prototype/scripts/import-wikibooks-v2.mjs
```

Importadores experimentais substituídos foram removidos da árvore ativa; seu histórico continua disponível no Git.

## Backend NestJS/Prisma arquivado

A primeira implementação em NestJS + Prisma + PostgreSQL foi retirada da árvore principal para evitar confusão, builds desnecessários e documentação divergente.

Ela foi preservada antes da remoção na branch:

```text
legacy/nest-prisma
```

O antigo `docker-compose.yml`, `backend/src`, `backend/prisma` e configurações exclusivas do NestJS também saíram da árvore ativa.

## `docs/`

Documentação oficial:

- `escopo.md`: definição acadêmica e funcional;
- `funcionalidades.md`: mapa do que está implementado;
- `architecture.md`: arquitetura da solução;
- `api.md`: rotas e contratos;
- `database.md`: modelo do D1, índices e migrations;
- `catalogo.md`: origem, licenças e importação;
- `testes.md`: estratégia de testes;
- `deploy.md`: CI, deploy e operação;
- `estrutura-repositorio.md`: organização do código;
- `README.md`: índice da documentação.

## `.github/workflows/`

Workflows ativos:

- `ci.yml`: valida o frontend;
- `api-worker-ci.yml`: valida a API Worker;
- `deploy-cloudflare.yml`: publica o frontend;
- `deploy-api-cloudflare.yml`: valida, aplica migrations e publica a API;
- `import-wikibooks.yml`: importa manualmente Wikilivros/Commons.

## Dependabot

O `dependabot.yml` acompanha somente:

- `frontend/`;
- `backend/worker-prototype/`.

## Governança

- `CONTRIBUTING.md`: fluxo de contribuição e validações;
- `SECURITY.md`: reporte responsável de vulnerabilidades;
- `LICENSE`: MIT para o código original do projeto.

A MIT não substitui as licenças das receitas e imagens importadas.

## Regra para novas funcionalidades

Ao adicionar uma funcionalidade:

1. alterar o componente ativo correto;
2. criar migration nova quando o schema mudar;
3. atualizar contrato da API e tipos do frontend;
4. incluir teste de regressão/integração adequado ao risco;
5. atualizar a documentação relacionada;
6. remover implementações substituídas em vez de manter código morto;
7. abrir PR e aguardar os checks de CI.

## Documentos relacionados

- [`README.md`](README.md)
- [`funcionalidades.md`](funcionalidades.md)
- [`architecture.md`](architecture.md)
- [`api.md`](api.md)
- [`database.md`](database.md)
- [`deploy.md`](deploy.md)
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
- [`../SECURITY.md`](../SECURITY.md)
