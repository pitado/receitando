# Receitando

O **Receitando** ajuda a responder uma pergunta simples: **o que eu consigo cozinhar com o que já tenho em casa?**

A pessoa informa os ingredientes disponíveis, o sistema compara com o catálogo de receitas e mostra as melhores combinações primeiro, destacando o percentual de compatibilidade, os ingredientes encontrados e o que ainda está faltando.

## Produção

- Site: **https://receitando.miguelpita.com.br**
- API: **https://api.receitando.miguelpita.com.br**
- Healthcheck: **https://api.receitando.miguelpita.com.br/api/health**

O projeto está publicado na **Cloudflare**. O frontend roda em um Worker gerado pelo OpenNext, enquanto a API roda em um Worker separado com persistência no **Cloudflare D1**.

## Arquitetura atual

```text
Navegador
   │
   ▼
receitando.miguelpita.com.br
Next.js + OpenNext
Cloudflare Worker
   │  HTTP/JSON
   ▼
api.receitando.miguelpita.com.br
Cloudflare Worker
   │
   ▼
Cloudflare D1
```

### Componentes principais

- `frontend/`: aplicação Next.js + React + TypeScript;
- `backend/worker-prototype/`: API de produção em Cloudflare Workers;
- `backend/worker-prototype/migrations/`: schema e dados iniciais do D1;
- `.github/workflows/`: CI e deploys para Cloudflare;
- `backend/`: implementação anterior em NestJS/Prisma/PostgreSQL, mantida como referência do desenvolvimento inicial.

## Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- App Router
- OpenNext para Cloudflare
- Cloudflare Workers

### API e banco

- Cloudflare Workers
- TypeScript
- Wrangler
- Cloudflare D1
- Web Crypto API para hash e validação de senhas

### Automação

- GitHub Actions
- deploy automático do frontend após mudanças em `frontend/**` na `main`;
- deploy da API pelo workflow `Deploy API Cloudflare`;
- migrations do D1 aplicadas pelo Wrangler antes do deploy da API.

## Funcionalidades atuais

- busca de receitas por ingredientes disponíveis;
- cálculo de compatibilidade e ingredientes faltantes;
- catálogo de receitas;
- página de detalhes de receita;
- cadastro de usuário;
- login e logout;
- sessão persistente com opção **Lembrar de mim**;
- identificação do usuário autenticado no cabeçalho;
- estruturas de despensa e favoritos preparadas para evolução.

## API

Rotas atualmente publicadas:

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/api/health` | healthcheck |
| `POST` | `/api/auth/register` | criar conta e iniciar sessão |
| `POST` | `/api/auth/login` | autenticar usuário |
| `GET` | `/api/auth/me` | consultar usuário autenticado |
| `POST` | `/api/auth/logout` | encerrar sessão |
| `GET` | `/api/ingredients` | listar ingredientes |
| `GET` | `/api/recipes` | listar receitas |
| `GET` | `/api/recipes/slug/:slug` | buscar receita por slug |
| `POST` | `/api/recipes/match` | calcular compatibilidade por ingredientes |

Exemplo de matching:

```bash
curl -X POST https://api.receitando.miguelpita.com.br/api/recipes/match \
  -H "Content-Type: application/json" \
  -d '{"ingredients":["ovo","banana","farinha de trigo","leite"]}'
```

## Desenvolvimento local

### Pré-requisitos

- Node.js 20.9 ou superior
- npm 10 ou superior

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Por padrão, o cliente usa `NEXT_PUBLIC_API_URL`. Para desenvolver usando a API local do Worker, crie `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8787
```

O frontend fica disponível em:

```text
http://localhost:3000
```

### API Worker + D1 local

```bash
cd backend/worker-prototype
npm ci
npm run migrate:local
npm run dev
```

O Wrangler normalmente disponibiliza o Worker local em:

```text
http://localhost:8787
```

## Cloudflare

### Frontend

Configuração principal em `frontend/wrangler.jsonc`.

O frontend aponta para:

```dotenv
NEXT_PUBLIC_API_URL=https://api.receitando.miguelpita.com.br
```

O deploy de produção usa:

```bash
npm run build:cloudflare
npx opennextjs-cloudflare deploy -- --keep-vars
```

### API

Configuração principal em `backend/worker-prototype/wrangler.jsonc`.

Recursos de produção:

- Worker: `round-mouse-8bbd`;
- domínio: `api.receitando.miguelpita.com.br`;
- D1: `receitando`;
- binding do banco: `env.db`;
- frontend permitido pelo CORS: `https://receitando.miguelpita.com.br`.

Para aplicar migrations e publicar manualmente com Wrangler:

```bash
cd backend/worker-prototype
npm run migrate:remote
npm run deploy
```

Em produção, o fluxo recomendado é executar o workflow **Deploy API Cloudflare** no GitHub Actions.

## GitHub Actions

Os principais workflows são:

- **CI**: valida frontend e a implementação original do backend;
- **API Worker CI**: valida TypeScript e empacotamento do Worker da API;
- **Deploy Cloudflare**: publica o frontend automaticamente na Cloudflare após alterações na `main`;
- **Deploy API Cloudflare**: aplica migrations remotas do D1 e publica a API.

Os secrets necessários no repositório são:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

O token usado no deploy precisa ter acesso de edição aos **Workers Scripts** e ao **D1**.

## Qualidade

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

API Worker:

```bash
cd backend/worker-prototype
npm run typecheck
npm run dry-run
```

## Próximas evoluções

- tornar a despensa persistente por usuário;
- favoritos persistentes;
- quantidades e validade dos alimentos;
- histórico e preferências;
- substituições e equivalências de ingredientes;
- priorização de alimentos próximos do vencimento;
- recuperação de senha.

---

Projeto acadêmico em evolução. A infraestrutura de produção atual usa **GitHub + Cloudflare Workers + D1**.