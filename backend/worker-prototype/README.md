# API do Receitando — Cloudflare Worker + D1

Este diretório contém a **API atual de produção** do Receitando.

O nome `worker-prototype` é histórico. Hoje o diretório concentra autenticação, catálogo, matching, despensa, favoritos, perfil, recuperação de senha, feed, votos, comentários, rate limiting e persistência no Cloudflare D1.

## Entrypoint

`wrangler.jsonc` publica:

```text
src/auth-rate-limit-worker.ts
```

Essa camada protege login/cadastro contra abuso e delega as demais requisições pela cadeia funcional.

## Cadeia atual

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

- `auth-rate-limit-worker.ts`: limite de tentativas de autenticação/cadastro;
- `home-worker.ts`: `/api/home-feed`;
- `catalog64-worker.ts`: fontes, ingredientes, receitas, detalhe, matching e favoritos;
- `social-worker.ts`: votos e comentários;
- `profile-worker.ts`: `/api/auth/me`;
- `password-reset-worker.ts`: recuperação de senha e Resend;
- `pantry-worker.ts`: despensa;
- `index.ts`: healthcheck, cadastro, login, logout e fallback final.

As implementações antigas de catálogo/matching que existiam também em `index.ts` foram removidas. A rota de detalhe canônica é `/api/recipes/:slug` e o matching manual possui um único limite de 40 ingredientes.

## Infraestrutura compartilhada

`src/lib/worker-http.ts` concentra:

- interface `Env`;
- origens autorizadas;
- headers de CORS;
- respostas JSON;
- respostas de erro;
- respostas vazias;
- extração do Bearer token;
- resolução básica de sessão;
- parsing seguro de JSON.

`src/lib/security.ts` concentra PBKDF2, verificação em tempo constante, SHA-256 e conversões utilizadas por autenticação/recuperação.

Essa centralização reduz divergências entre Workers.

## Execução local

```bash
npm ci
npm run migrate:local
npm run dev
```

API padrão:

```text
http://localhost:8787
```

## Validação

```bash
npm run typecheck
npm test
npm run dry-run
```

- `typecheck`: valida todo `src/**/*.ts`;
- `test`: compila os Workers/bibliotecas para `.test-dist/` e executa `tests/*.test.cjs`;
- `dry-run`: valida o bundle/configuração do Wrangler sem publicar.

## Testes

A suíte possui duas camadas.

### Regras puras

- normalização de ingredientes;
- percentual/status do matching;
- PBKDF2;
- verificação de senha;
- salt aleatório;
- SHA-256;
- políticas de rate limiting.

### Rotas e persistência simulada

`tests/worker-routes.test.cjs` executa `fetch()` dos Workers reais usando um D1 fake controlado.

Entre os casos cobertos:

- entrypoint real e healthcheck;
- cadastro/sessão;
- ausência das rotas duplicadas antigas em `index.ts`;
- despensa autenticada;
- catálogo como dono canônico das rotas de receita;
- limite de 40 ingredientes;
- não colisão de detalhe por slug com rotas sociais;
- atribuição completa de imagem;
- favoritos;
- perfil;
- votos/comentários;
- recuperação sem enumeração de e-mail;
- feed da home.

Esses testes não acessam o D1 remoto nem enviam e-mail real.

## Rate limiting

Políticas versionadas no Worker:

- login por e-mail: **5 falhas / 15 minutos**;
- login por IP: **20 falhas / 15 minutos**;
- cadastro por IP: **5 tentativas / 1 hora**.

Ao atingir o limite, a API responde `429` com `Retry-After`.

E-mail/IP usados nos buckets são persistidos apenas como SHA-256. Em produção, o IP vem de `CF-Connecting-IP`.

Uma regra adicional no WAF/Rate Limiting da Cloudflare pode ser usada como defesa de borda complementar.

## Estrutura

```text
worker-prototype/
├── migrations/              histórico versionado do D1
├── scripts/
│   ├── README.md
│   └── import-wikibooks-v2.mjs
├── src/
│   ├── lib/
│   └── ... workers atuais
├── tests/
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.tests.json
├── worker-configuration.d.ts
└── wrangler.jsonc
```

Importadores experimentais substituídos foram removidos da árvore atual; o histórico permanece no Git.

## Dependências

A API atual usa D1 diretamente. Dependências antigas de PostgreSQL/Prisma (`pg`, `@prisma/adapter-pg`, `@types/pg`) foram removidas deste pacote porque não eram importadas pelo código de produção.

## Banco

Binding:

```text
db → Cloudflare D1 / receitando
```

Migrations:

```text
migrations/
```

Comandos:

```bash
npm run migrate:local
npm run migrate:remote
```

Migrations já aplicadas não são reescritas. `0008b_prepare_catalog_v3b.sql` é uma etapa histórica intencional e está explicada em [`../../docs/database.md`](../../docs/database.md).

## Catálogo

Fonte operacional:

- Wikilivros em português;
- Wikimedia Commons.

Script:

```text
scripts/import-wikibooks-v2.mjs
```

Workflow:

```text
.github/workflows/import-wikibooks.yml
```

A API retorna procedência da receita em `source` e procedência específica da imagem em `image`.

## Recuperação de senha

A solicitação utiliza uma resposta genérica para e-mails válidos, exista ou não uma conta. Isso evita enumeração de usuários.

Códigos:

- expiram;
- possuem limite de tentativas;
- são armazenados por PBKDF2;
- geram um token temporário persistido somente como hash.

Depois da troca de senha, sessões existentes do usuário são invalidadas.

## Variáveis e secrets

- `db`: binding D1;
- `FRONTEND_URL`: origens aceitas;
- `EMAIL_FROM`: remetente do reset;
- `RESEND_API_KEY`: **secret**.

Credenciais reais de Cloudflare/Resend nunca devem ser commitadas.

## Deploy

O workflow de produção executa:

1. `npm ci`;
2. `npm run typecheck`;
3. `npm test`;
4. `npm run dry-run`;
5. migrations remotas;
6. deploy do Worker.

Detalhes: [`../../docs/deploy.md`](../../docs/deploy.md).

## Backend histórico

O NestJS/Prisma/PostgreSQL diretamente em `backend/` é uma implementação anterior preservada apenas como referência. Ele não é chamado, compilado nem publicado por esta API.

## Documentação

- [`../../docs/architecture.md`](../../docs/architecture.md)
- [`../../docs/api.md`](../../docs/api.md)
- [`../../docs/database.md`](../../docs/database.md)
- [`../../docs/catalogo.md`](../../docs/catalogo.md)
- [`../../docs/deploy.md`](../../docs/deploy.md)
- [`../../SECURITY.md`](../../SECURITY.md)
- [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)
