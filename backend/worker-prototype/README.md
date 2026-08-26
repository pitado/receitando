# API do Receitando — Cloudflare Worker + D1

Este diretório contém a **API atual de produção** do Receitando.

O nome `worker-prototype` é histórico. Hoje o diretório concentra autenticação, catálogo, busca, matching, despensa, favoritos, perfil, recuperação de senha, feed, votos, comentários, rate limiting e persistência no Cloudflare D1.

## Entrypoint

`wrangler.jsonc` publica:

```text
src/session-cookie-worker.ts
```

Essa camada controla a sessão por cookie `HttpOnly`, CORS credenciado e validação de `Origin`. Em seguida, ela envia a requisição ao dispatcher central `app-router.ts`.

## Roteamento atual

```text
session-cookie-worker
        ↓
app-router
   ├── auth-rate-limit-worker → index / password-reset-worker
   ├── home-worker
   ├── catalog64-worker
   ├── social-worker
   ├── profile-worker
   ├── password-reset-worker
   ├── pantry-worker
   └── index
```

O roteador escolhe diretamente o módulo responsável, evitando que toda requisição atravesse uma cadeia completa de Workers até encontrar a rota certa.

Responsabilidades:

- `session-cookie-worker.ts`: cookie `HttpOnly`, CORS credenciado e defesa adicional contra CSRF;
- `app-router.ts`: dispatcher central;
- `auth-rate-limit-worker.ts`: rate limiting de login/cadastro/solicitação de reset;
- `home-worker.ts`: `/api/home-feed`;
- `catalog64-worker.ts`: fontes, ingredientes, FTS5, receitas, detalhe, matching e favoritos;
- `social-worker.ts`: votos e comentários;
- `profile-worker.ts`: `/api/auth/me`;
- `password-reset-worker.ts`: recuperação de senha e Resend;
- `pantry-worker.ts`: despensa;
- `index.ts`: healthcheck, cadastro, login, logout e fallback final.

As implementações duplicadas de catálogo/matching que existiam em `index.ts` foram removidas. A rota de detalhe canônica é `/api/recipes/:slug`.

## Bibliotecas compartilhadas

`src/lib/worker-http.ts` centraliza CORS, respostas JSON/erro, autorização interna e parsing de JSON.

`src/lib/session-cookie.ts` centraliza leitura, criação e expiração do cookie de sessão.

`src/lib/security.ts` centraliza PBKDF2, verificação de senha, SHA-256 e conversões usadas por autenticação/recuperação.

`src/lib/recipe-utils.ts` centraliza normalização, canonicalização conservadora de ingredientes, geração de candidatos de lookup, percentual e classificação do matching.

## Matching canônico

`ingredients` funciona como catálogo canônico e `ingredient_aliases` relaciona formas alternativas ao mesmo `ingredient_id`.

A API resolve o nome completo normalizado e a forma canônica por igualdade. Ela **não usa substring para decidir equivalência**.

Exemplos:

```text
cebolas picadas → cebola
ovos            → ovo
```

Enquanto isso:

```text
óleo ≠ óleo de gergelim torrado
açúcar ≠ açúcar de confeiteiro
```

A migration `0015_matching_search_hardening.sql` adiciona `ingredients.is_staple`. Ingredientes básicos marcados com essa flag não entram no denominador da compatibilidade nem na lista principal de faltantes.

A regra desta versão é booleano (`tem` / `não tem`). Quantidades e unidades são persistidas, mas ainda não participam da porcentagem.

## Busca textual

A listagem de receitas usa a tabela virtual FTS5 `recipe_search` quando o parâmetro `q` é informado.

A consulta usa `MATCH` e `bm25()` em vez de `LIKE '%termo%'`. Triggers no D1 mantêm título e descrição sincronizados com a tabela `recipes`.

## Sessão

O frontend autentica exclusivamente por cookie de sessão. Em produção ele usa:

- `HttpOnly`;
- `Secure`;
- `SameSite=Strict`;
- prefixo `__Host-`;
- `Path=/`.

O token bruto não faz parte do contrato público de login/cadastro. O D1 persiste somente seu SHA-256.

## Execução local

```bash
npm ci
npm run migrate:local
npm run dev
```

API padrão: `http://localhost:8787`.

## Validação

```bash
npm run typecheck
npm test
npm run dry-run
```

A suíte cobre regras puras e rotas/persistência simulada, incluindo:

- normalização e canonicalização;
- staples no matching;
- uso de FTS5 na busca;
- limite de entrada do matching;
- PBKDF2/SHA-256;
- cadastro e sessões;
- despensa/favoritos;
- perfil;
- votos/comentários;
- recuperação sem enumeração de conta;
- rate limiting;
- roteamento central;
- atribuição de imagem;
- feed da home.

Os testes não acessam D1 remoto nem enviam e-mail real.

## Rate limiting

Políticas atuais:

- login por e-mail: **5 falhas / 15 minutos**;
- login por IP: **20 falhas / 15 minutos**;
- cadastro por IP: **5 tentativas / 1 hora**;
- recuperação por e-mail: **3 solicitações / 15 minutos**;
- recuperação por IP: **10 solicitações / 15 minutos**.

Ao atingir o limite, a API responde `429` com `Retry-After`. E-mails/IP usados nos buckets são persistidos apenas como SHA-256.

Uma regra adicional no WAF/Rate Limiting da Cloudflare pode ser usada como defesa de borda complementar.

## Estrutura

```text
worker-prototype/
├── migrations/                       histórico versionado do D1
├── scripts/
│   ├── README.md
│   ├── import-wikibooks-v2.mjs
│   └── canonicalize-ingredients.mjs
├── src/
│   ├── app-router.ts
│   ├── session-cookie-worker.ts
│   ├── lib/
│   └── ... workers por domínio
├── tests/
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.tests.json
└── wrangler.jsonc
```

Importadores experimentais substituídos foram removidos da árvore atual; o histórico permanece no Git.

## Banco e integridade

Binding:

```text
db → Cloudflare D1 / receitando
```

Migrations são aplicadas por ordem e nunca reescritas depois de compartilhadas. O schema usa chaves estrangeiras com políticas de cascata/restrição e índices explícitos para acessos frequentes.

Comandos:

```bash
npm run migrate:local
npm run migrate:remote
```

Detalhes: [`../../docs/database.md`](../../docs/database.md).

## Catálogo

Fonte operacional:

- Wikilivros em português;
- Wikimedia Commons.

O workflow de catálogo executa o importador e depois `canonicalize-ingredients.mjs`, que consolida variações para IDs canônicos, preserva aliases e marca staples.

A API retorna procedência da receita em `source` e procedência específica da imagem em `image`.

## Conteúdo externo

O importador converte o conteúdo culinário usado pela aplicação para texto. A página de receita não renderiza HTML bruto do Wikilivros. Se futuramente houver HTML rico externo, ele deverá ser sanitizado antes da renderização.

## Recuperação de senha

A solicitação usa resposta genérica para e-mails válidos, exista ou não uma conta, e passa pelo rate limiting antes de alcançar o Resend.

Códigos expiram, possuem limite de tentativas e são armazenados de forma derivada. Depois da troca de senha, sessões existentes são invalidadas.

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

## Backend histórico

A implementação antiga NestJS/Prisma/PostgreSQL foi removida da árvore principal e preservada na branch `legacy/nest-prisma`.

## Documentação

- [`../../docs/architecture.md`](../../docs/architecture.md)
- [`../../docs/api.md`](../../docs/api.md)
- [`../../docs/database.md`](../../docs/database.md)
- [`../../docs/catalogo.md`](../../docs/catalogo.md)
- [`../../docs/deploy.md`](../../docs/deploy.md)
- [`../../SECURITY.md`](../../SECURITY.md)
- [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)
