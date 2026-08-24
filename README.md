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
- deploy automático da API quando `backend/worker-prototype/**` muda na `main`
- aplicação das migrations do D1 antes do deploy da API
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

A primeira fonte externa estruturada usada pelo catálogo é o **Wikilivros em português**. As receitas importadas dessa fonte guardam:

- URL original;
- nome da fonte;
- autoria/colaboradores;
- licença;
- URL da licença;
- idioma;
- data da importação;
- texto original de cada ingrediente.

As receitas do Wikilivros são identificadas como conteúdo externo e usam a licença **CC BY-SA 4.0**. A página de detalhe mostra a origem e a licença com links para a fonte original.

Os scripts de importação ficam separados da lógica principal da aplicação. Conteúdo de terceiros só deve ser publicado quando sua licença ou autorização permitir o uso pretendido.

### Importação do Wikilivros

O workflow **Importar receitas do Wikilivros** é executado manualmente no GitHub Actions. Ele permite escolher uma categoria culinária e importar lotes de 5, 12, 25 ou 50 receitas.

Categorias aceitas atualmente:

- Salgados, Lanches e Sanduíches;
- Doces;
- Entradas;
- Massas;
- Quitandas;
- Sobremesas.

O importador usa a API MediaWiki, ignora páginas sem estrutura suficiente e só aceita receitas com pelo menos 3 ingredientes e 2 passos de preparo. Quando uma página contém várias versões de uma mesma receita, a primeira versão completa é usada.

A importação remota grava o SQL via `wrangler d1 execute --remote`. O arquivo gerado **não deve conter `BEGIN TRANSACTION`, `COMMIT` ou `SAVEPOINT` explícitos**, porque o D1 remoto não aceita essas instruções nesse fluxo; a execução remota é coordenada pelo Wrangler/D1.

As imagens do Wikimedia Commons não são importadas automaticamente nesta etapa, porque cada mídia pode ter uma licença diferente do texto da receita.

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
- fontes externas de receitas;
- matching por ingredientes ou pela despensa;
- despensa;
- favoritos;
- votos e comentários;
- feed da home.

Rotas relacionadas às fontes externas:

```text
GET /api/sources
GET /api/recipes?source=wikibooks
```

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

O deploy de produção é feito pelo workflow **Deploy API Cloudflare**. Em pushes na `main` que alterem o Worker, o workflow aplica as migrations remotas e publica a API automaticamente.

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

## Regra de documentação

Toda alteração que mude a engrenagem do projeto deve atualizar este README no mesmo PR. Isso inclui mudanças em:

- arquitetura;
- API;
- banco e migrations;
- autenticação;
- importadores e fontes externas;
- deploy e CI;
- integrações externas;
- fluxos principais do produto.

Mudanças apenas visuais, sem impacto no funcionamento ou na arquitetura, não exigem atualização do README.

## Documentação

- [`docs/architecture.md`](docs/architecture.md) — arquitetura atual;
- [`docs/api.md`](docs/api.md) — rotas e autenticação;
- [`docs/database.md`](docs/database.md) — modelo atual do D1;
- [`backend/worker-prototype/README.md`](backend/worker-prototype/README.md) — execução da API Worker.

---

Projeto acadêmico em evolução. A infraestrutura atual usa **GitHub Actions + Cloudflare Workers + D1**.
