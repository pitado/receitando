# Deploy, CI e operação

Este documento descreve como o Receitando é validado, publicado e operado.

## Ambientes principais

- Frontend de produção: `https://receitando.miguelpita.com.br`
- API de produção: `https://api.receitando.miguelpita.com.br`
- Frontend local: `http://localhost:3000`
- API local: `http://localhost:8787`

## Componentes publicados

O projeto possui dois componentes principais em produção:

1. **Frontend Next.js**, compilado com OpenNext e publicado em Cloudflare Workers.
2. **API Cloudflare Worker**, com persistência no Cloudflare D1.

O frontend e a API são publicados separadamente.

## Workflows do GitHub Actions

Os workflows ficam em `.github/workflows/`.

### Frontend

`deploy-cloudflare.yml` é responsável pelo deploy do frontend na Cloudflare.

O frontend também é validado por lint, typecheck e build antes de ser considerado saudável.

### API

`api-worker-ci.yml` valida a API Worker com:

- instalação limpa de dependências;
- `npm run typecheck`;
- `npm run dry-run`.

`deploy-api-cloudflare.yml` é o fluxo de publicação da API e aplica as migrations remotas antes de publicar o Worker.

### Catálogo

`import-wikibooks.yml` executa a importação manual do catálogo proveniente do Wikilivros e Wikimedia Commons.

Mais detalhes estão em [`catalogo.md`](catalogo.md).

## Secrets

Credenciais reais nunca devem ser commitadas.

Secrets de CI/deploy ficam no GitHub Actions e/ou no ambiente seguro da Cloudflare.

Entre os valores sensíveis utilizados pelo projeto estão credenciais de Cloudflare e integrações como a chave do Resend.

O repositório pode manter apenas nomes de variáveis e exemplos sem valores reais.

## Frontend local

```bash
cd frontend
npm ci
npm run dev
```

Crie `frontend/.env.local` com:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8787
```

Validação:

```bash
npm run lint
npm run typecheck
npm run build
```

## API local

```bash
cd backend/worker-prototype
npm ci
npm run migrate:local
npm run dev
```

Validação:

```bash
npm run typecheck
npm run dry-run
```

## Migrations

As migrations do banco ficam em:

```text
backend/worker-prototype/migrations/
```

Ambiente local:

```bash
npm run migrate:local
```

Ambiente remoto:

```bash
npm run migrate:remote
```

Migrations devem ser versionadas e nunca alteradas retroativamente depois de aplicadas em produção.

## Ordem segura de publicação da API

1. validar TypeScript;
2. validar configuração do Worker;
3. aplicar migrations;
4. publicar o Worker;
5. verificar o healthcheck;
6. testar rotas críticas.

## Healthcheck

A API oferece rota de healthcheck documentada em [`api.md`](api.md).

Ela pode ser usada para confirmar se o Worker está respondendo após um deploy.

## Catálogo após deploy

O deploy da aplicação e a importação de receitas são processos diferentes.

Publicar frontend ou API não significa repopular o catálogo. A importação do Wikilivros é acionada manualmente pelo workflow específico.

## Histórico no repositório

Existe uma implementação antiga em NestJS/Prisma dentro de `backend/`. Ela é mantida apenas como referência histórica e não deve ser confundida com a API de produção.

A API atual está em:

```text
backend/worker-prototype/
```

## Documentos relacionados

- [`architecture.md`](architecture.md)
- [`api.md`](api.md)
- [`database.md`](database.md)
- [`catalogo.md`](catalogo.md)
- [`estrutura-repositorio.md`](estrutura-repositorio.md)
