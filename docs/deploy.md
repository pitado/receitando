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

### Frontend CI

`ci.yml` valida o frontend em alterações de `frontend/`:

1. `npm ci`;
2. `npm run lint`;
3. `npm run typecheck`;
4. `npm run build`.

### Deploy do frontend

`deploy-cloudflare.yml` publica o frontend na Cloudflare. Antes do deploy ele executa novamente:

1. instalação limpa de dependências;
2. lint;
3. typecheck;
4. build com OpenNext;
5. deploy do Worker.

Essa validação dentro do próprio workflow de produção evita que um deploy dependa apenas do resultado de um job paralelo.

### API CI

`api-worker-ci.yml` valida a API Worker com:

- instalação limpa de dependências;
- `npm run typecheck` sobre todo `backend/worker-prototype/src/`;
- `npm test` para regras críticas de matching e segurança;
- `npm run dry-run`.

Os testes usam o test runner nativo do Node.js. Antes da execução, os helpers TypeScript testados são compilados por `tsconfig.tests.json` para `.test-dist/`, diretório temporário ignorado pelo Git.

### Deploy da API

`deploy-api-cloudflare.yml` segue a ordem:

1. `npm ci`;
2. `npm run typecheck`;
3. `npm test`;
4. `npm run dry-run`;
5. `npm run migrate:remote`;
6. `npm run deploy`.

Assim código, testes e configuração/bundle do Worker são validados antes de qualquer migration remota ser aplicada.

### Catálogo

`import-wikibooks.yml` executa a importação manual do catálogo proveniente do Wikilivros e Wikimedia Commons.

O workflow valida a sintaxe do importador, aplica migrations necessárias e então executa `scripts/import-wikibooks-v2.mjs`.

Mais detalhes estão em [`catalogo.md`](catalogo.md).

### Workflow histórico

`import-recipes-64k.yml` está arquivado. Ele não importa dados para o D1 e apenas informa que o experimento de 64 mil receitas não representa a fonte atual do catálogo.

## Secrets

Credenciais reais nunca devem ser commitadas.

Secrets de CI/deploy ficam no GitHub Actions e/ou no ambiente seguro da Cloudflare.

Entre os valores sensíveis utilizados pelo projeto estão:

- `CLOUDFLARE_API_TOKEN`;
- `CLOUDFLARE_ACCOUNT_ID`;
- `RESEND_API_KEY`.

O repositório pode manter apenas nomes de variáveis, bindings públicos e exemplos sem valores reais.

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
npm test
npm run dry-run
```

O `tsconfig.json` da API inclui todos os arquivos TypeScript de `src/`, para que as camadas realmente utilizadas pelo entrypoint `src/home-worker.ts` sejam verificadas.

A suíte inicial cobre normalização de ingredientes, compatibilidade/status do matching, hash PBKDF2, verificação de senhas, salt aleatório, rejeição de hashes inválidos e SHA-256 usado em tokens. Mudanças futuras em rotas e persistência devem ampliar a cobertura com testes de integração quando apropriado.

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

Migrations devem ser versionadas e nunca alteradas retroativamente depois de aplicadas em produção. Uma mudança de schema deve entrar em uma migration nova.

## Ordem segura de publicação da API

1. instalar dependências a partir do lockfile;
2. validar TypeScript;
3. executar testes automatizados;
4. executar dry-run do Worker;
5. aplicar migrations;
6. publicar o Worker;
7. verificar o healthcheck;
8. testar rotas críticas.

## Healthcheck

A API oferece rota de healthcheck documentada em [`api.md`](api.md).

Ela pode ser usada para confirmar se o Worker está respondendo após um deploy.

## Catálogo após deploy

O deploy da aplicação e a importação de receitas são processos diferentes.

Publicar frontend ou API não significa repopular o catálogo. A importação do Wikilivros é acionada manualmente pelo workflow específico.

## Dependabot

As atualizações automáticas de dependências acompanham apenas os componentes atuais:

- `frontend/`;
- `backend/worker-prototype/`.

A implementação histórica em NestJS não recebe atualizações automáticas.

PRs automáticos de dependências devem ser revisados com CI verde e atenção especial a atualizações major. Dependências ou PRs obsoletos não devem permanecer indefinidamente abertos apenas para aumentar ruído operacional.

## Histórico no repositório

Existe uma implementação antiga em NestJS/Prisma dentro de `backend/`. Ela é mantida apenas como referência histórica e não deve ser confundida com a API de produção.

A API atual está em:

```text
backend/worker-prototype/
```

## Segurança operacional

O procedimento para relatar vulnerabilidades está em [`../SECURITY.md`](../SECURITY.md). Detalhes exploráveis não devem ser publicados em issues comuns.

## Documentos relacionados

- [`architecture.md`](architecture.md)
- [`api.md`](api.md)
- [`database.md`](database.md)
- [`catalogo.md`](catalogo.md)
- [`estrutura-repositorio.md`](estrutura-repositorio.md)
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
- [`../SECURITY.md`](../SECURITY.md)
