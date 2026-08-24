# Receitando

O **Receitando** é um projeto acadêmico que ajuda a responder uma pergunta simples: **o que dá para cozinhar com o que já existe em casa?**

A pessoa pode informar ingredientes manualmente ou manter uma despensa vinculada à conta. O sistema compara esses ingredientes com o catálogo e prioriza receitas pela compatibilidade, mostrando o que já está disponível e o que ainda falta.

## Acesso

- Site: **https://receitando.miguelpita.com.br**
- API: **https://api.receitando.miguelpita.com.br**

## Arquitetura atual

```text
Navegador
   │
   ▼
Next.js + React
OpenNext / Cloudflare Worker
   │  HTTP + JSON
   ▼
API em Cloudflare Worker
   │
   ├── Cloudflare D1
   └── Resend (recuperação de senha)
```

O frontend e a API são publicados separadamente. O frontend não acessa o banco diretamente; toda leitura e escrita passa pela API.

### Pastas principais

- `frontend/`: aplicação Next.js, React e TypeScript;
- `backend/worker-prototype/`: API atualmente usada em produção, apesar do nome histórico da pasta;
- `backend/worker-prototype/migrations/`: migrations do Cloudflare D1;
- `backend/worker-prototype/scripts/`: utilitários de importação de catálogos externos;
- `.github/workflows/`: CI, deploys e importações manuais;
- `backend/`: implementação inicial em NestJS, Prisma e PostgreSQL, mantida apenas como referência histórica;
- `docs/`: documentação técnica da arquitetura, API e modelo de dados atuais.

## Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- App Router
- OpenNext
- Cloudflare Workers

### API e persistência

- Cloudflare Workers
- TypeScript
- Wrangler
- Cloudflare D1
- Web Crypto API para senhas, sessões e tokens
- Resend para e-mails de recuperação de senha

### Automação

- GitHub Actions
- CI do frontend e da API Worker
- deploy automático do frontend após mudanças relevantes na `main`
- deploy manual da API com aplicação das migrations do D1
- workflows manuais para importação de catálogos externos

## Funcionalidades atuais

- catálogo e detalhes de receitas;
- busca de receitas por ingredientes;
- cálculo de compatibilidade e ingredientes faltantes;
- combinação usando diretamente a despensa do usuário;
- cadastro, login, logout e sessão persistente;
- perfil editável com nome, `@` e avatar;
- recuperação de senha por código enviado por e-mail;
- despensa persistente por usuário;
- quantidades e unidades opcionais na despensa;
- favoritos persistentes;
- avaliações de receita com gostei/não gostei;
- comentários por receita;
- feed da home com dados da comunidade;
- página 404 personalizada e estados de erro/carregamento no frontend.

## Catálogo de receitas

O modelo de dados aceita receitas próprias, receitas de usuários e fontes externas. O repositório também contém pipelines de importação usados em experimentos com catálogos públicos, incluindo **TheMealDB** e um dataset **CC0 de aproximadamente 64 mil receitas**.

Os scripts de importação ficam separados da lógica principal da aplicação. Conteúdo de terceiros só deve ser publicado quando sua licença ou autorização permitir o uso pretendido.

## API

A API usa JSON e prefixo `/api`. Algumas rotas são públicas e outras exigem autenticação por:

```text
Authorization: Bearer <token-da-sessao>
```

Resumo das áreas disponíveis:

- autenticação e perfil;
- recuperação de senha;
- ingredientes;
- catálogo e detalhes de receitas;
- matching por ingredientes ou pela despensa;
- despensa;
- favoritos;
- votos e comentários;
- feed da home.

A lista de rotas e exemplos está em [`docs/api.md`](docs/api.md).

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

Crie `frontend/.env.local` apontando para a API local:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8787
```

Frontend local:

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

Por padrão, o Wrangler disponibiliza a API local em:

```text
http://localhost:8787
```

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

## Deploy

### Frontend

A configuração está em `frontend/wrangler.jsonc`. O workflow de produção compila o Next.js com OpenNext e publica o Worker na Cloudflare.

### API

A configuração está em `backend/worker-prototype/wrangler.jsonc`.

Para validar ou executar localmente:

```bash
cd backend/worker-prototype
npm run typecheck
npm run migrate:local
npm run dev
```

O deploy de produção é feito pelo workflow **Deploy API Cloudflare**, que aplica as migrations remotas antes de publicar o Worker.

## Segurança e informações públicas

Este repositório pode documentar publicamente:

- arquitetura e stack;
- URLs que já são públicas;
- rotas da API;
- estrutura do banco e migrations;
- nomes de bindings e variáveis de ambiente;
- nomes dos secrets usados pelo CI.

**Nunca devem ser commitados** valores reais de tokens, chaves de API, credenciais, tokens de sessão, códigos de recuperação, senhas ou dados privados de usuários.

Secrets de produção ficam no GitHub Actions ou na configuração segura da Cloudflare. Arquivos `.env.example` devem conter apenas valores locais ou placeholders.

## Documentação

- [`docs/architecture.md`](docs/architecture.md) — arquitetura atual;
- [`docs/api.md`](docs/api.md) — rotas e autenticação;
- [`docs/database.md`](docs/database.md) — modelo atual do D1;
- [`backend/worker-prototype/README.md`](backend/worker-prototype/README.md) — execução da API Worker.

---

Projeto acadêmico em evolução. A infraestrutura atual usa **GitHub Actions + Cloudflare Workers + D1**.
