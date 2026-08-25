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

## Ponto de entrada

O `wrangler.jsonc` aponta para:

```text
src/home-worker.ts
```

A partir dele, as camadas da API são encadeadas até `src/index.ts`. O arquivo `worker-configuration.d.ts` acompanha esse mesmo entrypoint para que tipos e configuração reflitam a aplicação realmente publicada.

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

## Validação e testes

```bash
npm run typecheck
npm test
npm run dry-run
```

O `typecheck` cobre todos os arquivos TypeScript em `src/`. O `npm test` compila a cadeia atual dos Workers e executa a suíte com o test runner nativo do Node.js. O `dry-run` valida o bundle/configuração do Worker sem publicar.

A suíte possui duas camadas.

### Regras puras

- normalização de ingredientes;
- cálculo de compatibilidade;
- classificação `READY` / `ALMOST_READY` / `NEAR` / `EXPLORE`;
- hash PBKDF2 de senhas;
- verificação de senha;
- salt aleatório;
- rejeição de hashes inválidos;
- SHA-256 usado no tratamento de tokens.

### Rotas dos Workers

Os testes carregam os Workers compilados e chamam seus métodos `fetch()` com objetos `Request`. Um D1 fake controlado pela suíte simula a interface usada pela aplicação, sem acessar dados de produção.

Entre os fluxos validados estão:

- healthcheck e CORS;
- validação e criação de conta/sessão;
- proteção de rotas autenticadas;
- inclusão na despensa;
- perfil autenticado;
- votos e comentários;
- recuperação de senha;
- fonte Wikilivros e matching;
- feed da home;
- delegação de rotas através da cadeia completa dos Workers.

Isso amplia a proteção para as camadas ativas `home-worker`, `catalog64-worker`, `social-worker`, `profile-worker`, `password-reset-validation-worker`, `password-reset-worker`, `pantry-worker` e `index`.

Os testes de rota usam **D1 simulado**; não são testes end-to-end contra a infraestrutura real da Cloudflare. Essa distinção está detalhada em [`../../docs/testes.md`](../../docs/testes.md).

A compilação específica dos testes é definida por `tsconfig.tests.json`, gera arquivos temporários em `.test-dist/` e é seguida pelos arquivos `tests/*.test.cjs`.

Essas validações fazem parte do CI e também antecedem migrations e deploy de produção.

## Estrutura

```text
worker-prototype/
├── migrations/          schema e evoluções do Cloudflare D1
├── scripts/             importador atual e scripts históricos documentados
├── src/
│   ├── lib/             regras puras reutilizadas e testáveis
│   └── ...              implementação atual da API Worker
├── tests/               testes de helpers e contratos de rotas
├── package.json         scripts e dependências
├── tsconfig.json        configuração TypeScript da API
├── tsconfig.tests.json  compilação da API para a suíte
├── worker-configuration.d.ts tipos do ambiente Cloudflare
└── wrangler.jsonc       entrypoint, domínio, vars e binding D1
```

Arquivos antigos de uma tentativa NestJS/Prisma/Hyperdrive que estavam misturados a `src/` foram removidos desta estrutura. O código NestJS preservado como histórico fica no diretório `backend/`, fora da API atual.

## Workers encadeados

A implementação atual é dividida em camadas que atendem grupos de rotas e encaminham as demais para a próxima camada.

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

Arquivos principais:

- `src/home-worker.ts`: ponto de entrada e feed da home;
- `src/catalog64-worker.ts`: fontes, catálogo, ingredientes e matching;
- `src/social-worker.ts`: votos e comentários;
- `src/profile-worker.ts`: perfil autenticado;
- `src/password-reset-validation-worker.ts`: validações do fluxo de recuperação;
- `src/password-reset-worker.ts`: recuperação de senha e integração de e-mail;
- `src/pantry-worker.ts`: despensa e favoritos;
- `src/index.ts`: autenticação e rotas-base;
- `src/lib/recipe-utils.ts`: normalização e regras puras de matching;
- `src/lib/security.ts`: hash/verificação de senha e SHA-256 reutilizáveis.

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

Migrations já aplicadas não devem ser reescritas; mudanças de schema entram em novos arquivos numerados.

## Catálogo

O catálogo oficial atual utiliza:

- Wikilivros em português para conteúdo;
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

Bindings/variáveis atuais relevantes:

- `db`: banco Cloudflare D1;
- `FRONTEND_URL`: origens permitidas do frontend;
- `EMAIL_FROM`: remetente da recuperação de senha;
- `RESEND_API_KEY`: secret da integração de e-mail.

Secrets reais não devem ser commitados. Credenciais de Cloudflare utilizadas no GitHub Actions também ficam armazenadas como secrets do repositório.

A tabela consolidada de variáveis está no [`../../README.md`](../../README.md).

## Deploy

O deploy da API é separado do frontend.

A rotina de produção:

1. instala dependências;
2. executa o typecheck de toda a API;
3. executa os testes automatizados;
4. executa `dry-run` do Worker;
5. aplica migrations remotas;
6. publica o Worker.

Mais detalhes em [`../../docs/deploy.md`](../../docs/deploy.md).

## Segurança

O procedimento de reporte responsável está em [`../../SECURITY.md`](../../SECURITY.md). Vulnerabilidades com detalhes exploráveis não devem ser abertas como issues públicas.

## Documentação relacionada

- [`../../README.md`](../../README.md)
- [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)
- [`../../SECURITY.md`](../../SECURITY.md)
- [`../../docs/README.md`](../../docs/README.md)
- [`../../docs/escopo.md`](../../docs/escopo.md)
- [`../../docs/funcionalidades.md`](../../docs/funcionalidades.md)
- [`../../docs/architecture.md`](../../docs/architecture.md)
- [`../../docs/api.md`](../../docs/api.md)
- [`../../docs/database.md`](../../docs/database.md)
- [`../../docs/catalogo.md`](../../docs/catalogo.md)
- [`../../docs/testes.md`](../../docs/testes.md)
- [`../../docs/deploy.md`](../../docs/deploy.md)
