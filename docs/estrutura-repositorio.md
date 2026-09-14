# Estrutura do repositório

Este documento explica o papel das partes principais do Receitando e mantém a árvore principal alinhada à arquitetura realmente usada em produção.

## Visão geral

```text
receitando/
├── .github/
│   ├── ISSUE_TEMPLATE/             templates de bugs e melhorias
│   ├── dependabot.yml              atualizações dos componentes ativos
│   ├── pull_request_template.md    checklist padrão de PR
│   └── workflows/                  CI, E2E, deploy e importação de receitas
├── backend/
│   ├── README.md
│   └── worker-prototype/           API atual de produção
│       ├── migrations/             histórico versionado do Cloudflare D1
│       ├── scripts/                importação, canonicalização e espelhamento R2
│       ├── src/                    implementação da API Worker
│       └── tests/                  testes automatizados da API
├── docs/                           documentação funcional e técnica
├── frontend/                       aplicação Next.js
│   ├── e2e/                        Playwright + testes de navegador
│   ├── public/
│   └── src/
├── AUTHORS.md                      autoria e participantes
├── CHANGELOG.md                    mudanças relevantes
├── CONTRIBUTING.md                 guia de contribuição
├── SECURITY.md                     política de segurança
├── receitando-requisitos.md        análise de requisitos
├── receitando-casos-de-uso.md      casos de uso e rastreabilidade
├── LICENSE                         GNU AGPLv3 do código original
├── README.md                       visão geral do projeto
└── .env.example                    referência de configuração sem secrets reais
```

## `frontend/`

É a aplicação web utilizada pelos usuários, construída com Next.js, React e TypeScript e publicada em Cloudflare Workers por meio do OpenNext.

Responsabilidades principais:

- navegação e interface;
- catálogo v2 e detalhes de receitas;
- matching por ingredientes;
- despensa e favoritos;
- conta, perfil e recuperação de senha;
- comentários e avaliações;
- envio de receitas da comunidade;
- painel de moderação para administradores;
- consumo da API.

A navegação principal inclui `/receitas`, `/combinar`, `/despensa`, `/favoritos` e `/enviar-receita`.

`frontend/src/` contém o produto e os testes Vitest/Testing Library. `frontend/e2e/` contém uma instalação isolada do Playwright, configuração do navegador, mocks determinísticos da API e jornadas E2E.

Arquivos relevantes para comunidade/moderação:

```text
frontend/src/app/enviar-receita/page.tsx
frontend/src/app/admin/receitas/page.tsx
frontend/src/components/recipe/RecipeSubmissionForm.tsx
frontend/src/services/recipe-submissions.service.ts
frontend/src/services/admin-recipe-submissions.service.ts
```

Mais detalhes em [`../frontend/README.md`](../frontend/README.md) e [`../frontend/e2e/README.md`](../frontend/e2e/README.md).

## `backend/worker-prototype/`

Apesar do nome histórico, esta é a **API atual de produção**.

O entrypoint efetivamente publicado é definido em `wrangler.jsonc` e atualmente é:

```text
src/session-cookie-worker.ts
```

O Wrangler também declara:

```text
db             → Cloudflare D1
RECIPE_IMAGES  → Cloudflare R2 / receitando-recipe-images
```

A API usa um dispatcher central em vez de depender de uma corrente linear de fallbacks:

```text
session-cookie-worker
        ↓
app-router
   ├── auth-rate-limit-worker
   ├── home-worker
   ├── catalog-v2-worker
   ├── recipe-submission-worker
   ├── recipe-adaptation-worker
   ├── social-worker
   ├── catalog64-worker
   ├── profile-worker
   ├── password-reset-worker
   ├── pantry-worker
   └── index
```

Responsabilidades:

- `session-cookie-worker.ts`: sessão por cookie `HttpOnly`, CORS credenciado e proteção de `Origin`;
- `app-router.ts`: roteamento central e escolha direta do módulo responsável;
- `auth-rate-limit-worker.ts`: proteção contra abuso de login, cadastro e solicitação de recuperação de senha;
- `home-worker.ts`: feed da home;
- `catalog-v2-worker.ts`: catálogo usado por `/receitas`, com FTS5, filtros, ordenação e paginação;
- `recipe-submission-worker.ts`: envio de receitas, armazenamento/entrega de imagens no R2 e moderação ADMIN;
- `recipe-adaptation-worker.ts`: adaptação de receita e substituições contextuais;
- `social-worker.ts`: votos e comentários;
- `catalog64-worker.ts`: fontes, ingredientes, catálogo legado, detalhe por slug, favoritos e matching;
- `profile-worker.ts`: consulta e atualização de perfil;
- `password-reset-worker.ts`: recuperação de senha e Resend;
- `pantry-worker.ts`: despensa;
- `index.ts`: cadastro, login, logout, healthcheck e fallback final;
- `lib/worker-http.ts`: helpers HTTP/CORS/autenticação e contrato de ambiente compartilhado;
- `lib/session-cookie.ts`: construção e leitura do cookie de sessão;
- `lib/recipe-utils.ts`: normalização canônica e regras do matching.

Rotas de catálogo/matching que eram duplicadas em `index.ts` foram removidas. O catálogo público principal agora é `catalog-v2-worker.ts`; `catalog64-worker.ts` continua responsável por matching, detalhe e contratos legados.

## Comunidade e moderação

O fluxo de receitas enviadas pela comunidade atravessa frontend, D1 e R2:

```text
/enviar-receita
      ↓
POST /api/recipe-submissions
      ↓
recipe-submission-worker
   ├── R2: foto da submissão
   └── D1: recipe_submissions (PENDING)
      ↓
/admin/receitas
      ↓
GET/PATCH /api/admin/recipe-submissions
      ↓
APPROVED → recipes (source_type=USER) → /api/v2/recipes
REJECTED → recipe_submissions + motivo/revisor/data
```

`recipe_submissions.user_id` é opcional, portanto o envio pode ocorrer sem autenticação. As rotas administrativas validam `users.role = 'ADMIN'` no servidor.

## Testes

### API

A suíte fica em `backend/worker-prototype/tests/` e é executada com:

```bash
npm test
```

Ela cobre matching, normalização de ingredientes, segurança, rate limiting, roteamento central, catálogo v2, submissões/moderação e rotas críticas do Worker.

### Frontend

Os testes unitários/componentes ficam em `frontend/src/**/*.test.ts(x)` e usam Vitest + React Testing Library.

Os E2E ficam em:

```text
frontend/e2e/
```

O Playwright inicia o Next.js localmente e intercepta uma URL de API exclusiva da suíte. Ele não usa D1 de produção, contas reais nem Resend.

Detalhes: [`testes.md`](testes.md).

## Catálogo e scripts

Scripts operacionais mantidos na árvore atual:

```text
backend/worker-prototype/scripts/import-wikibooks-v2.mjs
backend/worker-prototype/scripts/canonicalize-ingredients.mjs
backend/worker-prototype/scripts/mirror-wikibooks-images-to-r2.mjs
```

O primeiro importa o catálogo, o segundo canonicaliza ingredientes/aliases e o terceiro espelha imagens para o R2.

Importadores experimentais substituídos foram removidos da árvore ativa; seu histórico continua disponível no Git.

## Migrations

O histórico fica em:

```text
backend/worker-prototype/migrations/
```

Entre as migrations recentes estão `0013_recipe_submissions.sql`, que cria a fila de submissões, e `0016_recipe_submission_moderation.sql`, que adiciona campos/índices de moderação e publicação.

Também existe `0013_recipe_image_attribution.sql`. A colisão do prefixo `0013` é histórica e não deve ser corrigida por renumeração retroativa.

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
- `glossario.md`: vocabulário do projeto;
- `funcionalidades.md`: mapa do que está implementado;
- `architecture.md`: arquitetura da solução;
- `api.md`: rotas e contratos;
- `database.md`: modelo do D1, R2, índices e migrations;
- `catalogo.md`: origem, licenças e importação;
- `motor-adaptacao.md`: adaptação e substituições;
- `mobile-upload-login.md`: envio de receita/foto e acesso à conta no mobile;
- `testes.md`: estratégia de testes;
- `deploy.md`: CI, deploy e operação;
- `estrutura-repositorio.md`: organização do código;
- `README.md`: índice da documentação.

Os arquivos `receitando-requisitos.md` e `receitando-casos-de-uso.md` ficam na raiz por decisão de visibilidade, mas fazem parte da documentação acadêmica.

## `.github/workflows/`

Workflows ativos:

- `ci.yml`: lint, typecheck, Vitest/cobertura e build do frontend;
- `e2e.yml`: jornadas de navegador em Chromium com Playwright e artefatos por 7 dias;
- `api-worker-ci.yml`: typecheck, testes e dry-run da API Worker;
- `deploy-cloudflare.yml`: publica o frontend;
- `deploy-api-cloudflare.yml`: valida, aplica migrations, publica a API e espelha imagens;
- `import-wikibooks.yml`: importa manualmente Wikilivros/Commons com categoria/meta configurável.

Todos configuram Node.js 22 no CI.

## Dependabot

O `dependabot.yml` acompanha somente:

- `frontend/`;
- `backend/worker-prototype/`.

A dependência do Playwright fica isolada em `frontend/e2e/`; atualizações dessa ferramenta devem ser feitas de forma planejada junto com o lockfile da suíte.

## Governança

- `AUTHORS.md`: autoria e participantes;
- `CONTRIBUTING.md`: fluxo de contribuição e validações;
- `SECURITY.md`: reporte responsável de vulnerabilidades;
- `LICENSE`: GNU Affero General Public License v3.0 (AGPL-3.0-only) para o código original do projeto.

A licença do projeto não substitui as licenças próprias das receitas e imagens importadas.

## Regra para novas funcionalidades

Ao adicionar uma funcionalidade:

1. registrar a rota no `app-router.ts` quando necessário;
2. alterar o módulo ativo responsável;
3. criar migration nova quando o schema mudar;
4. atualizar contrato da API e tipos do frontend;
5. incluir teste de regressão/integração adequado ao risco;
6. avaliar E2E quando a mudança afetar uma jornada completa de usuário;
7. atualizar a documentação relacionada;
8. remover implementações substituídas em vez de manter código morto;
9. abrir PR e aguardar os checks de CI.

## Documentos relacionados

- [`README.md`](README.md)
- [`funcionalidades.md`](funcionalidades.md)
- [`architecture.md`](architecture.md)
- [`api.md`](api.md)
- [`database.md`](database.md)
- [`mobile-upload-login.md`](mobile-upload-login.md)
- [`testes.md`](testes.md)
- [`deploy.md`](deploy.md)
- [`../frontend/e2e/README.md`](../frontend/e2e/README.md)
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
- [`../SECURITY.md`](../SECURITY.md)
