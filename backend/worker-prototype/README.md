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
src/auth-rate-limit-worker.ts
```

Essa camada aplica proteção contra abuso nas rotas de login e cadastro e, quando a requisição pode continuar, encaminha para `src/home-worker.ts`. A partir daí, as camadas funcionais da API são encadeadas até `src/index.ts`.

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

O `typecheck` cobre todos os arquivos TypeScript em `src/`. O `npm test` executa a suíte automatizada com o test runner nativo do Node.js, e o `dry-run` valida o bundle/configuração do Worker sem publicar.

A cobertura automatizada inclui regras usadas pelo código real de produção:

- normalização de ingredientes;
- cálculo de compatibilidade;
- classificação `READY` / `ALMOST_READY` / `NEAR` / `EXPLORE`;
- hash PBKDF2 de senhas;
- verificação de senha;
- salt aleatório;
- hashes inválidos;
- SHA-256 usado no tratamento de tokens;
- políticas de rate limiting de autenticação;
- expiração da janela de bloqueio;
- limpeza de tentativas de login após autenticação bem-sucedida;
- armazenamento apenas de hash do e-mail/IP usado pelos buckets de limitação.

Os helpers testáveis ficam em `src/lib/`. A compilação específica dos testes é definida por `tsconfig.tests.json`, gera arquivos temporários em `.test-dist/` e é seguida pelos testes em `tests/*.test.cjs`.

Essas validações fazem parte do CI e, para a API, também antecedem migrations e deploy de produção.

## Proteção de autenticação

A API mantém uma defesa versionada no próprio Worker para reduzir força bruta e criação automatizada de contas.

Políticas atuais:

- login por e-mail: até **5 falhas em 15 minutos**;
- login por IP: até **20 falhas em 15 minutos**;
- cadastro por IP: até **5 tentativas válidas em 1 hora**.

Quando o limite é atingido, a API responde com HTTP `429` e `Retry-After`. As chaves de limitação são persistidas no D1 apenas como SHA-256; e-mails e IPs não são gravados em texto puro nessa tabela. Eventos antigos são removidos de forma oportunista.

O IP usado é `CF-Connecting-IP`, fornecido pela Cloudflare em produção. Uma regra de Rate Limiting/WAF na borda da Cloudflare continua recomendada como segunda camada de defesa, porque ela pode barrar tráfego antes de chegar ao Worker e ao D1.

## Estrutura

```text
worker-prototype/
├── migrations/        schema e evoluções do Cloudflare D1
├── scripts/           importador atual e scripts históricos documentados
├── src/
│   ├── lib/           regras puras reutilizadas e testáveis
│   └── ...            implementação atual da API Worker
├── tests/             testes automatizados
├── package.json       scripts e dependências
├── tsconfig.json      configuração TypeScript da API
├── tsconfig.tests.json compilação dos helpers testados
├── worker-configuration.d.ts tipos do ambiente Cloudflare
└── wrangler.jsonc     entrypoint, domínio, vars e binding D1
```

Arquivos antigos de uma tentativa NestJS/Prisma/Hyperdrive que estavam misturados a `src/` foram removidos desta estrutura. O código NestJS preservado como histórico fica no diretório `backend/`, fora da API atual.

## Workers encadeados

A implementação atual é dividida em camadas que atendem grupos de rotas e encaminham as demais para a próxima camada.

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
password-reset-validation-worker
   ↓
password-reset-worker
   ↓
pantry-worker
   ↓
index
```

Arquivos principais:

- `src/auth-rate-limit-worker.ts`: proteção de login/cadastro e entrypoint publicado;
- `src/home-worker.ts`: feed da home;
- `src/catalog64-worker.ts`: fontes, catálogo, ingredientes e matching;
- `src/social-worker.ts`: votos e comentários;
- `src/profile-worker.ts`: perfil autenticado;
- `src/password-reset-validation-worker.ts`: validações do fluxo de recuperação;
- `src/password-reset-worker.ts`: recuperação de senha e integração de e-mail;
- `src/pantry-worker.ts`: despensa e favoritos;
- `src/index.ts`: autenticação e rotas-base;
- `src/lib/auth-rate-limit.ts`: regras e persistência dos buckets de limitação;
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

A migration de rate limiting é aplicada antes de o novo entrypoint ser publicado, evitando que o Worker novo seja ativado sem a tabela necessária.

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
- [`../../docs/deploy.md`](../../docs/deploy.md)
