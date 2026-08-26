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

A implementação antiga NestJS/Prisma/PostgreSQL foi removida da árvore principal e preservada na branch `legacy/nest-prisma`; ela não participa do CI ou deploy atual.

## Workflows ativos

Os workflows ficam em `.github/workflows/`.

### `ci.yml` — frontend

Em alterações relevantes do frontend:

1. `npm ci`;
2. `npm run lint`;
3. `npm run typecheck`;
4. `npm run test:coverage`;
5. `npm run build`.

### `deploy-cloudflare.yml` — frontend

Antes de publicar, repete instalação, lint, typecheck, testes com cobertura, build OpenNext e só então deploy.

### `api-worker-ci.yml` — API

Valida a API com:

1. `npm ci`;
2. `npm run typecheck`;
3. `npm test`;
4. `npm run dry-run`.

A suíte executa regras puras e testes de `fetch()` dos Workers reais com D1 simulado.

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

Workflow manual e independente do deploy que:

1. instala dependências;
2. valida `import-wikibooks-v2.mjs` e `canonicalize-ingredients.mjs`;
3. aplica migrations necessárias;
4. importa receitas e imagens com licença livre;
5. remove conteúdo que não pertence à política operacional atual conforme a rotina do importador;
6. canonicaliza ingredientes e aliases;
7. marca ingredientes básicos e otimiza o D1.

Workflows/importadores experimentais substituídos foram removidos da árvore ativa.

## Entrypoint da API

O Wrangler publica:

```text
backend/worker-prototype/src/auth-rate-limit-worker.ts
```

Essa camada protege login, cadastro e solicitação de recuperação de senha antes de delegar ao restante da API.

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

## O que os testes da API cobrem

A suíte inclui:

- normalização e canonicalização de ingredientes;
- exclusão de staples do cálculo de compatibilidade;
- uso de FTS5 na busca textual;
- PBKDF2 e SHA-256;
- rate limiting de login, cadastro e solicitação de recuperação;
- cadastro e criação de sessão;
- autorização de despensa/favoritos/perfil;
- votos e comentários;
- recuperação de senha sem enumeração de conta;
- limite de 40 ingredientes;
- roteamento sem colisão entre detalhe de receita e rotas sociais;
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

## Catálogo não faz parte do deploy

Publicar frontend/API não repopula receitas. A importação e canonicalização do Wikilivros/Commons ocorrem apenas pelo workflow dedicado.

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

## Checklist pós-deploy da API

1. confirmar sucesso do workflow;
2. verificar `/api/health`;
3. confirmar login/cadastro e rate limiting;
4. testar solicitação de recuperação sem exceder o limite;
5. consultar catálogo e busca textual;
6. executar um matching com variação de ingrediente e staple;
7. testar uma rota autenticada com conta de teste;
8. confirmar que nenhuma importação inesperada foi executada.

## Segurança operacional

Vulnerabilidades devem seguir [`../SECURITY.md`](../SECURITY.md); detalhes exploráveis não devem ser publicados em issue aberta.

## Documentos relacionados

- [`architecture.md`](architecture.md)
- [`api.md`](api.md)
- [`database.md`](database.md)
- [`catalogo.md`](catalogo.md)
- [`estrutura-repositorio.md`](estrutura-repositorio.md)
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
