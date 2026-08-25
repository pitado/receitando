# API do Receitando — Cloudflare Worker + D1

Este diretório contém a **API atualmente usada pelo Receitando em produção**.

O nome `worker-prototype` é histórico. A implementação deixou de ser um protótipo e hoje concentra autenticação, catálogo, matching, despensa, favoritos, perfil, recuperação de senha, feed, votos e comentários.

## Arquitetura

```text
Frontend Next.js
      │
      ▼
Cloudflare Worker API
      │
      ├── Cloudflare D1
      └── Resend
```

O frontend nunca acessa o D1 diretamente.

## Execução local

```bash
npm ci
npm run migrate:local
npm run dev
```

A API local fica normalmente em:

```text
http://localhost:8787
```

## Validação

```bash
npm run typecheck
npm run dry-run
```

Esses comandos também fazem parte da validação automatizada da API.

## Estrutura

```text
worker-prototype/
├── migrations/        schema e evoluções do Cloudflare D1
├── scripts/           importação e manutenção do catálogo
├── src/               implementação da API
├── package.json       scripts e dependências
├── tsconfig.json      configuração TypeScript
└── wrangler.jsonc     configuração do Worker e bindings
```

## Workers encadeados

A implementação atual é dividida em camadas que atendem grupos de rotas e encaminham as demais para a próxima camada.

Arquivos principais:

- `src/home-worker.ts`: ponto de entrada configurado no Wrangler e feed da home;
- `src/catalog64-worker.ts`: catálogo, ingredientes, matching e leitura relacionada a receitas;
- `src/social-worker.ts`: votos e comentários;
- `src/profile-worker.ts`: perfil autenticado;
- `src/password-reset-validation-worker.ts`: validações do fluxo de recuperação;
- `src/password-reset-worker.ts`: recuperação de senha e integração de e-mail;
- `src/pantry-worker.ts`: despensa e favoritos;
- `src/index.ts`: autenticação e rotas-base.

## Banco de dados

A persistência usa **Cloudflare D1** com binding `db`.

Migrations:

```text
migrations/
```

Aplicar localmente:

```bash
npm run migrate:local
```

Aplicar remotamente:

```bash
npm run migrate:remote
```

O deploy da API aplica migrations remotas antes de publicar o Worker.

## Catálogo

O catálogo oficial atual utiliza:

- Wikilivros em português;
- Wikimedia Commons para imagens livres.

O importador operacional atual é:

```text
scripts/import-wikibooks-v2.mjs
```

O workflow correspondente é:

```text
.github/workflows/import-wikibooks.yml
```

A pasta `scripts/` também contém arquivos históricos de experimentos anteriores, identificados em [`scripts/README.md`](scripts/README.md). Eles não representam a fonte atual de produção.

## Variáveis e secrets

Variáveis não secretas podem ficar em `wrangler.jsonc` ou em arquivos `.env.example` seguros.

Secrets reais não devem ser commitados.

A recuperação de senha utiliza integração com Resend e espera secret de produção como:

```text
RESEND_API_KEY
```

Credenciais de Cloudflare utilizadas no GitHub Actions também ficam armazenadas como secrets do repositório.

## Deploy

O deploy da API é separado do frontend.

A rotina de produção:

1. instala dependências;
2. valida o projeto;
3. aplica migrations remotas;
4. publica o Worker.

Mais detalhes em [`../../docs/deploy.md`](../../docs/deploy.md).

## Documentação relacionada

- [`../../README.md`](../../README.md)
- [`../../docs/README.md`](../../docs/README.md)
- [`../../docs/escopo.md`](../../docs/escopo.md)
- [`../../docs/architecture.md`](../../docs/architecture.md)
- [`../../docs/api.md`](../../docs/api.md)
- [`../../docs/database.md`](../../docs/database.md)
- [`../../docs/catalogo.md`](../../docs/catalogo.md)
- [`../../docs/deploy.md`](../../docs/deploy.md)
