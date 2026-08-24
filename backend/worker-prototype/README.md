# API do Receitando — Cloudflare Worker + D1

Este diretório contém a **API atualmente usada pelo Receitando em produção**. O nome `worker-prototype` é histórico: a implementação deixou de ser apenas um protótipo e hoje concentra autenticação, catálogo, matching, despensa, favoritos, perfil, recuperação de senha e recursos sociais.

## Execução

```bash
npm ci
npm run typecheck
npm run migrate:local
npm run dev
```

O Wrangler normalmente inicia a API local em:

```text
http://localhost:8787
```

## Estrutura

- `src/home-worker.ts`: ponto de entrada configurado no Wrangler e feed da home;
- `src/catalog64-worker.ts`: catálogo, ingredientes, matching e leitura de favoritos;
- `src/social-worker.ts`: votos e comentários;
- `src/profile-worker.ts`: perfil autenticado;
- `src/password-reset-worker.ts`: recuperação de senha e integração de e-mail;
- `src/pantry-worker.ts`: despensa e favoritos;
- `src/index.ts`: autenticação e rotas-base;
- `migrations/`: schema e evoluções do Cloudflare D1;
- `scripts/`: importadores de catálogos externos.

Os Workers são encadeados: quando uma camada não atende a rota, a requisição é encaminhada para a próxima camada até chegar às rotas-base.

## Variáveis e secrets

Variáveis de configuração não secretas podem ficar em `wrangler.jsonc`, como origens permitidas e remetente de e-mail.

Secrets de produção **não devem ser commitados**. Atualmente a recuperação de senha espera:

```text
RESEND_API_KEY
```

O deploy via GitHub Actions utiliza credenciais da Cloudflare armazenadas como secrets do repositório.

## Banco

A persistência usa **Cloudflare D1**, com binding `db`.

Migrations locais:

```bash
npm run migrate:local
```

Migrations remotas:

```bash
npm run migrate:remote
```

O deploy de produção executa as migrations remotas antes de publicar o Worker.

## Validação

```bash
npm run typecheck
npm run dry-run
```

## Documentação relacionada

- [`../../README.md`](../../README.md)
- [`../../docs/api.md`](../../docs/api.md)
- [`../../docs/architecture.md`](../../docs/architecture.md)
- [`../../docs/database.md`](../../docs/database.md)
