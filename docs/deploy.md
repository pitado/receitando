# Deploy, CI e operação

Este documento descreve como o Receitando é validado, publicado e operado.

## Ambientes

- Frontend: `https://receitando.miguelpita.com.br`
- API: `https://api.receitando.miguelpita.com.br`
- Frontend local: `http://localhost:3000`
- API local: `http://localhost:8787`

## Componentes publicados

1. **Frontend Next.js**, compilado com OpenNext e publicado em Cloudflare Workers.
2. **API Cloudflare Worker**, publicada separadamente, com dados relacionais em Cloudflare D1 e imagens operacionais no Cloudflare R2.

A implementação antiga NestJS/Prisma/PostgreSQL foi removida da árvore principal e preservada na branch `legacy/nest-prisma`; ela não participa do CI ou deploy atual.

## Versão do Node.js

Os `package.json` do frontend e da API aceitam:

```text
>=20.9.0 <25
```

Portanto, o mínimo suportado é Node.js 20.9 e a faixa atual vai até Node.js 24.x. Os seis workflows oficiais validam e executam com **Node.js 22**.

## Workflows ativos

Os workflows ficam em `.github/workflows/`.

### `ci.yml` — Frontend CI

Em alterações relevantes do frontend:

1. `npm ci`;
2. `npm run lint`;
3. `npm run typecheck`;
4. `npm run test:coverage`;
5. `npm run build`.

### `api-worker-ci.yml` — API Worker CI

Valida a API com:

1. `npm ci`;
2. `npm run typecheck`;
3. `npm test`;
4. `npm run dry-run`.

A suíte executa regras puras e testes de `fetch()` dos Workers reais com D1 simulado.

### `e2e.yml` — E2E Playwright

Executa as jornadas em Chromium real:

1. instala dependências do frontend;
2. instala dependências isoladas de `frontend/e2e/`;
3. instala Chromium com dependências do sistema;
4. executa `npm test` da suíte E2E;
5. publica o relatório Playwright;
6. em falha, publica também os artefatos de teste.

Relatórios e artefatos são retidos por **7 dias**.

### `deploy-cloudflare.yml` — frontend

Antes de publicar, repete instalação, lint, typecheck, testes com cobertura, build OpenNext e só então deploy.

### `deploy-api-cloudflare.yml` — API

Ordem atual:

1. `npm ci`;
2. registra que o bucket R2 `receitando-recipe-images` já existe;
3. `npm run typecheck`;
4. `npm test`;
5. `npm run dry-run`;
6. `npm run migrate:remote`;
7. `npm run deploy`;
8. executa `mirror-wikibooks-images-to-r2.mjs`.

Migrations remotas só são aplicadas depois de código, testes e bundle passarem nas validações anteriores.

### `import-wikibooks.yml` — catálogo

Workflow manual e independente do deploy. O acionamento permite escolher:

- categoria do Wikilivros;
- meta de receitas: 25, 50, 100, 250, 500 ou todas.

Fluxo:

1. instala dependências;
2. valida `import-wikibooks-v2.mjs`, `canonicalize-ingredients.mjs` e `mirror-wikibooks-images-to-r2.mjs`;
3. aplica migrations necessárias;
4. importa receitas e imagens com licença livre;
5. canonicaliza ingredientes e aliases;
6. copia imagens importadas para o R2.

Workflows/importadores experimentais substituídos foram removidos da árvore ativa.

## Entrypoint da API

O Wrangler publica:

```text
backend/worker-prototype/src/session-cookie-worker.ts
```

Essa camada aplica a política de sessão por cookie, CORS e validação de `Origin`, e então delega para `app-router.ts`.

O roteador envia somente login, cadastro e solicitação inicial de recuperação de senha para `auth-rate-limit-worker.ts`; as demais famílias seguem para seus Workers de domínio, incluindo `catalog-v2-worker.ts`, `recipe-submission-worker.ts` e `recipe-adaptation-worker.ts`.

## Bindings e variáveis públicas

`backend/worker-prototype/wrangler.jsonc` declara:

- `db` — Cloudflare D1;
- `RECIPE_IMAGES` — Cloudflare R2, bucket `receitando-recipe-images`;
- `FRONTEND_URL` — origens aceitas pelo CORS, separadas por vírgula;
- `EMAIL_FROM` — remetente dos e-mails transacionais.

## Desenvolvimento local

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Validação completa:

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

### API

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

### E2E

```bash
cd frontend/e2e
npm ci
npx playwright install --with-deps chromium
npm test
```

## O que os testes da API cobrem

A suíte inclui:

- normalização e canonicalização de ingredientes;
- exclusão de staples do cálculo de compatibilidade;
- uso de FTS5 na busca textual;
- catálogo v2 e filtros;
- PBKDF2 e SHA-256;
- rate limiting de login, cadastro e solicitação de recuperação;
- cadastro e criação de sessão;
- autorização de despensa/favoritos/perfil;
- votos e comentários;
- recuperação de senha sem enumeração de conta;
- limite de 40 ingredientes no matching;
- roteamento sem colisão entre detalhe de receita e rotas sociais;
- submissão de receitas e armazenamento de imagem em R2 simulado;
- autorização ADMIN e moderação de submissões;
- atribuição de imagem;
- feed da home.

O D1 usado nos testes de rota é simulado; eles não escrevem no banco de produção.

## Migrations

Diretório:

```text
backend/worker-prototype/migrations/
```

Local:

```bash
npm run migrate:local
```

Remoto:

```bash
npm run migrate:remote
```

Migrations já compartilhadas são histórico imutável. Mudanças entram em novos arquivos.

A migration `0015_matching_search_hardening.sql` adiciona `is_staple`, índices adicionais e o índice virtual FTS5 `recipe_search`.

Existem duas migrations históricas com prefixo `0013`: `0013_recipe_image_attribution.sql` e `0013_recipe_submissions.sql`. Elas não devem ser renumeradas retroativamente.

## Catálogo não faz parte do deploy de conteúdo

Publicar frontend/API não executa uma nova descoberta/importação de receitas do Wikilivros. A importação e canonicalização ocorrem apenas pelo workflow dedicado.

O deploy da API atualmente executa o espelhamento das imagens do catálogo já registrado para o R2 depois de publicar o Worker; isso não equivale a importar novas receitas.

## Secrets

Valores sensíveis ficam em GitHub Actions/Cloudflare, nunca no repositório:

- `CLOUDFLARE_API_TOKEN`;
- `CLOUDFLARE_ACCOUNT_ID`;
- `RESEND_API_KEY`;
- qualquer credencial, senha ou token real.

`RESEND_API_KEY` é necessária para o envio dos códigos de recuperação de senha. Sem ela, o Worker de recuperação não consegue enviar o e-mail.

O token usado nos fluxos de Cloudflare precisa ter permissões de edição adequadas sobre Workers Scripts, D1 e operações de R2 utilizadas pela automação. O bucket `receitando-recipe-images` é **pré-criado**; o workflow de deploy não depende de permissão administrativa para listar ou criar buckets R2.

## Dependabot

A configuração atual acompanha somente:

- `/frontend`;
- `/backend/worker-prototype`.

## Checklist pós-deploy da API

1. confirmar sucesso do workflow;
2. verificar `/api/health`;
3. confirmar login/cadastro e rate limiting;
4. testar solicitação de recuperação sem exceder o limite;
5. consultar `/api/v2/recipes` com paginação/filtro;
6. executar um matching com variação de ingrediente e staple;
7. testar uma rota autenticada com conta de teste;
8. verificar o envio de uma receita/foto e a entrega da imagem pelo R2;
9. com conta ADMIN de teste, confirmar a fila de moderação sem alterar conteúdo real indevidamente;
10. confirmar que nenhuma importação inesperada foi executada.

## Segurança operacional

Vulnerabilidades devem seguir [`../SECURITY.md`](../SECURITY.md); detalhes exploráveis não devem ser publicados em issue aberta.

## Documentos relacionados

- [`architecture.md`](architecture.md)
- [`api.md`](api.md)
- [`database.md`](database.md)
- [`catalogo.md`](catalogo.md)
- [`mobile-upload-login.md`](mobile-upload-login.md)
- [`estrutura-repositorio.md`](estrutura-repositorio.md)
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
