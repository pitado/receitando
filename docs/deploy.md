# Deploy, CI e operação

Este documento descreve como o Receitando é validado, publicado e operado.

## Ambientes

- Frontend: `https://receitando.miguelpita.com.br`
- API: `https://api.receitando.miguelpita.com.br`
- Frontend local: `http://localhost:3000`
- API local: `http://localhost:8787`

## Componentes publicados

1. **Frontend Next.js**, compilado com OpenNext e publicado em Cloudflare Workers.
2. **API Cloudflare Worker**, publicada separadamente e persistindo dados em Cloudflare D1.

O backend NestJS/Prisma existente em `backend/` é histórico e não participa do deploy atual.

## Workflows ativos

Os workflows ficam em `.github/workflows/`.

### `ci.yml` — frontend

Em alterações relevantes do frontend:

1. `npm ci`;
2. `npm run lint`;
3. `npm run typecheck`;
4. `npm run test:coverage`;
5. `npm run build`.

A suíte usa Vitest/Testing Library e possui limites mínimos de cobertura definidos em `frontend/vitest.config.mts`.

### `deploy-cloudflare.yml` — frontend

Antes de publicar:

1. instalação pelo lockfile;
2. lint;
3. typecheck;
4. testes com cobertura;
5. build OpenNext;
6. deploy na Cloudflare.

Assim o deploy não depende apenas de um CI paralelo já executado.

### `api-worker-ci.yml` — API

Valida a API com:

1. `npm ci`;
2. `npm run typecheck`;
3. `npm test`;
4. `npm run dry-run`.

`tsconfig.tests.json` compila os Workers e bibliotecas para `.test-dist/`. A suíte usa o test runner nativo do Node.js.

Além das regras puras, existem testes de integração do roteamento que chamam `fetch()` das camadas reais com um D1 simulado. Isso valida fluxos sem escrever no banco de produção.

### `deploy-api-cloudflare.yml` — API

Ordem segura:

1. `npm ci`;
2. `npm run typecheck`;
3. `npm test`;
4. `npm run dry-run`;
5. `npm run migrate:remote`;
6. `npm run deploy`.

Migrations remotas só são aplicadas depois de código, testes e bundle passarem nas validações anteriores.

### `import-wikibooks.yml` — catálogo

Workflow manual que:

1. prepara dependências/configuração;
2. aplica migrations necessárias;
3. valida o importador;
4. executa `scripts/import-wikibooks-v2.mjs`;
5. grava o catálogo no D1.

É independente dos deploys da aplicação.

Workflows experimentais substituídos foram removidos da árvore ativa.

## Entrypoint da API

O Wrangler publica:

```text
backend/worker-prototype/src/auth-rate-limit-worker.ts
```

O healthcheck atravessa a cadeia de Workers até a camada base e é usado como uma verificação simples pós-deploy.

## Desenvolvimento local

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

## O que os testes da API cobrem

A suíte atual inclui:

- normalização e cálculo de matching;
- PBKDF2 e SHA-256;
- rate limiting de autenticação;
- cadastro e criação de sessão;
- autorização de despensa/favoritos/perfil;
- votos e comentários;
- recuperação de senha sem enumeração de conta;
- limite canônico de 40 ingredientes;
- roteamento sem colisão entre detalhe de receita e rotas sociais;
- atribuição de imagem no contrato da receita;
- feed da home;
- delegação pelo entrypoint real.

O D1 usado nesses testes é um fake controlado, portanto eles são testes de integração da aplicação e não E2E contra a infraestrutura remota.

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

Migrations já compartilhadas são histórico imutável. Mudanças futuras entram em novos arquivos, sem renumerar os anteriores.

## Catálogo não faz parte do deploy

Publicar frontend/API não repopula receitas. A importação do Wikilivros/Commons ocorre apenas pelo workflow dedicado.

## Secrets

Valores sensíveis ficam em GitHub Actions/Cloudflare, nunca no repositório:

- `CLOUDFLARE_API_TOKEN`;
- `CLOUDFLARE_ACCOUNT_ID` quando utilizado operacionalmente;
- `RESEND_API_KEY`;
- qualquer credencial, senha ou token real.

## Dependabot

A configuração atual acompanha somente:

- `/frontend`;
- `/backend/worker-prototype`.

Minor/patch são agrupados. Majors exigem planejamento/revisão específica.

O backend NestJS histórico não recebe atualização automática porque não é um componente mantido de produção.

## Checklist pós-deploy da API

1. confirmar sucesso do workflow;
2. verificar `/api/health`;
3. confirmar login/cadastro e rate limiting;
4. consultar catálogo e detalhe de uma receita;
5. testar uma rota autenticada com conta de teste;
6. confirmar que nenhuma migration/importação inesperada foi executada.

## Segurança operacional

Vulnerabilidades devem seguir [`../SECURITY.md`](../SECURITY.md); detalhes exploráveis não devem ser publicados em issue aberta.

## Documentos relacionados

- [`architecture.md`](architecture.md)
- [`api.md`](api.md)
- [`database.md`](database.md)
- [`catalogo.md`](catalogo.md)
- [`estrutura-repositorio.md`](estrutura-repositorio.md)
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
