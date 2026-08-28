# Receitando

[![Frontend CI](https://github.com/pitado/receitando/actions/workflows/ci.yml/badge.svg)](https://github.com/pitado/receitando/actions/workflows/ci.yml)
[![API Worker CI](https://github.com/pitado/receitando/actions/workflows/api-worker-ci.yml/badge.svg)](https://github.com/pitado/receitando/actions/workflows/api-worker-ci.yml)
[![License: GNU AGPLv3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

O **Receitando** é uma aplicação web acadêmica que ajuda a transformar os ingredientes disponíveis em casa em decisões práticas: descobrir o que cozinhar, aproveitar alimentos antes do vencimento, adaptar receitas e saber o que ainda precisa ser comprado.

O usuário pode informar ingredientes manualmente ou manter uma **despensa persistente** vinculada à conta. O sistema resolve variações para ingredientes canônicos, calcula compatibilidade com o catálogo e mostra o que já está disponível e o que falta.

A evolução atual do projeto vai além de um buscador de receitas: a despensa pode registrar validade, o combinador prioriza o aproveitamento de itens próximos do vencimento em resultados de compatibilidade semelhante e o detalhe da receita gera uma lista de compras baseada no que falta em casa.

> Escopo formal: [`docs/escopo.md`](docs/escopo.md)  
> Glossário de termos: [`docs/glossario.md`](docs/glossario.md)  
> Funcionalidades implementadas: [`docs/funcionalidades.md`](docs/funcionalidades.md)  
> Índice da documentação: [`docs/README.md`](docs/README.md)

## Acesso

- **Site:** https://receitando.miguelpita.com.br
- **API:** https://api.receitando.miguelpita.com.br

## Diferenciais atuais

### Despensa com validade

Cada item da despensa pode ter uma data de validade opcional. A interface:

- mostra a validade do item;
- destaca alimentos vencidos ou próximos do vencimento;
- exibe avisos como `Vence hoje`, `Vence amanhã` e `Vence em N dias`;
- ordena itens com validade mais próxima antes dos itens sem validade;
- permite adicionar o item primeiro e ajustar a validade depois.

O aviso de vencimento atual é **in-app**. Web Push, e-mail automático ou outra notificação em segundo plano ainda não fazem parte da implementação.

### Matching com prioridade de consumo

O matching continua usando compatibilidade como critério principal. Quando o usuário escolhe **Usar minha despensa**, o frontend também considera a validade para desempatar receitas com compatibilidade próxima.

A regra atual é:

1. diferenças de compatibilidade superiores a 5 pontos mantêm a maior compatibilidade primeiro;
2. dentro dessa faixa de 5 pontos, receitas que usam ingredientes mais urgentes recebem prioridade;
3. depois disso, permanecem os critérios de compatibilidade, menor quantidade de faltantes, menor tempo de preparo e título.

Peso de urgência usado na interface:

| Situação do ingrediente | Peso |
| --- | ---: |
| vencido ou vence hoje | 5 |
| vence amanhã | 4 |
| vence em 2–3 dias | 3 |
| vence em 4–7 dias | 1 |
| mais de 7 dias ou sem validade | 0 |

A porcentagem de compatibilidade em si **não é alterada pela validade**. A validade atua apenas na ordenação de resultados próximos quando o matching é feito pela despensa.

### Lista de compras automática

No detalhe da receita, usuários autenticados podem comparar a receita com a própria despensa e gerar uma lista somente com os ingredientes obrigatórios que ainda faltam.

- ingredientes já presentes são removidos da lista;
- opcionais e ingredientes básicos (`is_staple`) não entram na lista principal;
- a lista pode ser copiada;
- a comparação da lista continua seguindo presença/ausência, assim como o matching geral.

### Adaptação e substituição de ingredientes

O detalhe da receita também possui um **motor culinário experimental** que permite:

- alterar o número de porções;
- recalcular quantidades quando o rendimento original permite;
- marcar ingredientes indisponíveis;
- usar a despensa como referência;
- detectar quando a quantidade cadastrada parece insuficiente em unidades comparáveis;
- sugerir substituições conhecidas com nível de confiança e justificativa;
- considerar sinais do contexto culinário antes de recomendar uma troca.

Quando não existe substituição considerada confiável para aquele contexto, o sistema informa a limitação em vez de assumir uma equivalência arbitrária.

## O que já está implementado

### Receitas, busca e matching

- catálogo navegável e detalhe completo;
- busca textual indexada com SQLite FTS5;
- catálogo canônico de ingredientes e aliases;
- normalização conservadora de variações de ingredientes;
- equivalência por IDs canônicos, sem substring como regra de matching;
- ingredientes básicos (`is_staple`) que não penalizam a compatibilidade;
- percentual de compatibilidade;
- ingredientes encontrados, faltantes, opcionais e básicos;
- matching manual com até 40 ingredientes;
- matching diretamente pela despensa;
- prioridade de consumo por validade na ordenação da interface;
- adaptação de receita e substituições contextuais;
- lista de compras automática baseada na despensa.

### Conta, despensa e comunidade

- cadastro, login e logout;
- sessão persistente por cookie `HttpOnly`;
- perfil com nome, `@` e avatar;
- recuperação de senha por código enviado por e-mail;
- despensa persistente por usuário;
- quantidade, unidade e validade opcionais na despensa;
- favoritos persistentes;
- gostei/não gostei;
- comentários;
- edição e exclusão apenas do próprio comentário;
- feed da home com receitas populares, comentários recentes e totais.

### Segurança

- PBKDF2 via Web Crypto para senhas;
- SHA-256 para tokens de sessão e identificadores de rate limiting persistidos;
- cookie `HttpOnly`, `Secure` e `SameSite=Strict` em produção;
- validação de `Origin` em mutações do navegador;
- CORS credenciado restrito às origens configuradas;
- statements SQL parametrizados com `.bind()`;
- autorização por usuário em despensa, favoritos, votos e comentários;
- rate limiting em login, cadastro e solicitação de recuperação;
- resposta genérica no reset para reduzir enumeração de contas;
- secrets fora do repositório;
- conteúdo externo tratado como texto antes da renderização.

### Catálogo externo

- receitas do **Wikilivros em português**;
- imagens com licença livre do **Wikimedia Commons**;
- importação manual via GitHub Actions;
- canonicalização e aliases de ingredientes;
- procedência da receita;
- procedência, autor, página e licença da imagem;
- créditos exibidos no detalhe da receita.

## Limitação atual do matching

O matching principal ainda é **booleano**: considera se o ingrediente está presente ou ausente.

Quantidade e unidade são armazenadas e usadas pelo motor de adaptação em comparações compatíveis, mas **não alteram a porcentagem de compatibilidade do combinador**. Portanto, possuir `1 ovo` conta como presença do ingrediente `ovo`, mesmo que uma receita exija mais unidades.

Ingredientes marcados `is_staple`, como água, sal, pimenta e óleo genérico na política atual, continuam fazendo parte da receita, mas não entram no denominador da compatibilidade nem na lista principal de faltantes.

## Arquitetura

```text
Navegador
   │
   ▼
Next.js + React
OpenNext / Cloudflare Worker
   │
   │ HTTP + JSON + cookie HttpOnly
   ▼
API Cloudflare Worker
   │
   ├── Cloudflare D1
   └── Resend
```

O frontend nunca acessa o banco diretamente.

A API atual fica em `backend/worker-prototype/`. Apesar do nome histórico do diretório, essa é a implementação de backend mantida na árvore principal.

O `wrangler.jsonc` aponta para `src/session-cookie-worker.ts`. Depois das regras de sessão/CORS, `src/app-router.ts` direciona a requisição ao Worker responsável.

```text
session-cookie-worker
        ↓
app-router
   ├── auth-rate-limit-worker
   ├── home-worker
   ├── catalog64-worker
   ├── recipe-adaptation-worker
   ├── social-worker
   ├── profile-worker
   ├── password-reset-worker
   ├── pantry-worker
   └── index
```

Detalhes: [`docs/architecture.md`](docs/architecture.md).

## API — visão rápida

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api/health` | healthcheck |
| `POST` | `/api/auth/register` | cadastro |
| `POST` | `/api/auth/login` | login |
| `GET` / `PATCH` | `/api/auth/me` | perfil |
| `POST` | `/api/auth/logout` | logout |
| `POST` | `/api/auth/forgot-password` | solicitar recuperação |
| `POST` | `/api/auth/verify-reset-code` | validar código |
| `POST` | `/api/auth/reset-password` | trocar senha |
| `GET` | `/api/sources` | fontes do catálogo |
| `GET` | `/api/ingredients` | ingredientes canônicos |
| `GET` | `/api/recipes` | catálogo e busca |
| `GET` | `/api/recipes/:slug` | detalhe da receita |
| `POST` | `/api/recipes/match` | matching manual |
| `GET` | `/api/recipes/match/pantry` | matching pela despensa |
| `POST` | `/api/recipes/:slug/adapt` | adaptar receita/substituições |
| `GET` / `POST` | `/api/pantry` | listar/adicionar/atualizar despensa |
| `DELETE` | `/api/pantry/:itemId` | remover item |
| `GET` / `POST` | `/api/favorites` | favoritos |
| `DELETE` | `/api/favorites/:recipeId` | remover favorito |
| `GET` | `/api/recipes/:recipeId/social` | resumo social |
| `PUT` / `DELETE` | `/api/recipes/:recipeId/vote` | voto |
| `GET` / `POST` | `/api/recipes/:recipeId/comments` | comentários |
| `PATCH` / `DELETE` | `/api/recipe-comments/:commentId` | comentário próprio |
| `GET` | `/api/home-feed` | feed da home |

Documentação completa: [`docs/api.md`](docs/api.md).

## Regra de matching canônico

```text
texto informado/importado
        ↓
normalização
        ↓
nome completo + forma canônica conservadora
        ↓
ingredients.normalized_name / ingredient_aliases.normalized_alias
        ↓
ingredient_id canônico
        ↓
matching por presença
```

Exemplo:

```text
cebola / cebolas / cebolas picadas / cebola média
                         ↓
                       cebola
```

Compostos semanticamente diferentes permanecem separados: `óleo` não equivale automaticamente a `óleo de gergelim torrado`, e `açúcar` não equivale automaticamente a `açúcar de confeiteiro`.

## Banco de dados

Produção utiliza **Cloudflare D1**. O schema inclui usuários, sessões, catálogo canônico de ingredientes, aliases, receitas, despensa, favoritos, recuperação de senha, comunidade, atribuição de conteúdo, rate limiting e busca FTS5.

A coluna `pantry_items.expires_at` já fazia parte do schema original e agora é usada pela interface de validade; portanto, essa evolução não exigiu uma migration nova.

Migrations:

```text
backend/worker-prototype/migrations/
```

Detalhes: [`docs/database.md`](docs/database.md).

## Estrutura do repositório

```text
receitando/
├── frontend/                       aplicação Next.js
├── backend/
│   ├── README.md
│   └── worker-prototype/           API atual de produção
│       ├── migrations/             migrations do D1
│       ├── scripts/                importação/canonicalização
│       ├── src/                    Workers e bibliotecas
│       └── tests/                  testes da API
├── docs/                           documentação oficial
├── .github/                        CI, deploy, Dependabot e templates
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── README.md
```

A implementação antiga em NestJS + Prisma + PostgreSQL foi retirada da árvore principal e preservada na branch `legacy/nest-prisma`.

## Stack

**Frontend:** Next.js 16, React 19, TypeScript, App Router, OpenNext e Cloudflare Workers.

**API:** Cloudflare Workers, TypeScript, Wrangler, Cloudflare D1, Web Crypto API e Resend.

**Infraestrutura:** GitHub Actions, Cloudflare Workers, Cloudflare D1 e Dependabot.

## Desenvolvimento local

Pré-requisitos:

- Node.js 20.9+;
- npm 10+.

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

### API

```bash
cd backend/worker-prototype
npm ci
npm run migrate:local
npm run dev
```

Endereços padrão:

- frontend: `http://localhost:3000`;
- API: `http://localhost:8787`.

## Qualidade e testes

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

API:

```bash
cd backend/worker-prototype
npm run typecheck
npm test
npm run dry-run
```

A suíte combina testes unitários e testes de rota com D1 simulado. O repositório também possui E2E em navegador com Playwright.

## Deploy

Frontend e API possuem workflows separados, e a importação do catálogo é independente do deploy.

Guia operacional: [`docs/deploy.md`](docs/deploy.md).

## Documentação

- [`docs/README.md`](docs/README.md) — índice;
- [`docs/escopo.md`](docs/escopo.md) — escopo acadêmico;
- [`docs/glossario.md`](docs/glossario.md) — termos do projeto;
- [`docs/funcionalidades.md`](docs/funcionalidades.md) — estado implementado;
- [`docs/architecture.md`](docs/architecture.md) — arquitetura;
- [`docs/api.md`](docs/api.md) — contrato HTTP;
- [`docs/database.md`](docs/database.md) — D1, índices e migrations;
- [`docs/catalogo.md`](docs/catalogo.md) — receitas, imagens e licenças;
- [`docs/testes.md`](docs/testes.md) — estratégia de testes;
- [`docs/deploy.md`](docs/deploy.md) — CI/deploy/operação;
- [`docs/estrutura-repositorio.md`](docs/estrutura-repositorio.md) — estrutura do código;
- [`frontend/README.md`](frontend/README.md) — frontend;
- [`backend/worker-prototype/README.md`](backend/worker-prototype/README.md) — API atual;
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribuição;
- [`SECURITY.md`](SECURITY.md) — segurança.

## Licença

O código original do Receitando é disponibilizado sob **GNU Affero General Public License v3.0 (AGPL-3.0-only)**. Essa licença não altera as licenças próprias das receitas e imagens importadas de terceiros.

---

Projeto acadêmico em evolução, com produção baseada em **Next.js + Cloudflare Workers + Cloudflare D1 + GitHub Actions**.
