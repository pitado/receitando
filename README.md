# Receitando

O **Receitando** é um projeto acadêmico que ajuda a responder uma pergunta simples: **o que dá para cozinhar com o que já existe em casa?**

A pessoa pode informar ingredientes manualmente ou manter uma despensa vinculada à conta. O sistema compara esses ingredientes com o catálogo e prioriza receitas pela compatibilidade, mostrando o que já está disponível e o que ainda falta.

## Acesso

- Site: **https://receitando.miguelpita.com.br**
- API: **https://api.receitando.miguelpita.com.br**

## Arquitetura atual

```text
Fontes de receitas
   │
   ├── Wikilivros (MediaWiki API)
   └── outros catálogos autorizados/licenciados
   │
   ▼
Importadores + normalização
   │
   ▼
Cloudflare D1
   ▲
   │
API em Cloudflare Worker
   ▲
   │ HTTP + JSON
   │
Next.js + React
OpenNext / Cloudflare Worker
   ▲
   │
Navegador
```

O frontend e a API são publicados separadamente. O frontend não acessa o banco diretamente; toda leitura e escrita passa pela API.

As receitas externas também não são consultadas diretamente pelo navegador. Elas passam por um importador, são normalizadas para o formato do Receitando e armazenadas no D1 com metadados de origem, licença e idioma.

### Pastas principais

- `frontend/`: aplicação Next.js, React e TypeScript;
- `backend/worker-prototype/`: API atualmente usada em produção, apesar do nome histórico da pasta;
- `backend/worker-prototype/migrations/`: migrations do Cloudflare D1;
- `backend/worker-prototype/scripts/`: utilitários de importação e normalização de fontes externas;
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
- página 404 personalizada e estados de erro/carregamento no frontend;
- suporte a receitas externas com rastreabilidade de fonte e licença.

## Catálogo de receitas

O modelo de dados aceita receitas próprias, receitas de usuários e fontes externas.

### Wikilivros

A primeira fonte externa estruturada do projeto é o **Wikilivros em português**, consumido pela API do MediaWiki.

As receitas importadas guardam, quando aplicável:

- nome da fonte;
- URL da página original;
- identificador externo;
- autor/colaboradores;
- licença e URL da licença;
- idioma;
- data de importação;
- texto original de cada ingrediente.

A importação é intencionalmente curada. O workflow aceita apenas categorias culinárias definidas pelo projeto e ignora páginas que não tenham estrutura mínima de receita. Nesta etapa, uma página precisa ter pelo menos **3 ingredientes e 2 passos de preparo** para entrar no catálogo.

Quando uma página contém várias versões da mesma receita, o importador começa pela primeira versão completa encontrada.

As imagens do Wikimedia Commons não são importadas automaticamente nesta primeira etapa, porque cada arquivo pode ter uma licença própria que precisa ser validada separadamente.

O conteúdo importado do Wikilivros é identificado no Receitando com atribuição à fonte e licença **CC BY-SA 4.0**, além de link para a página original.

### Outras fontes e datasets

O repositório também contém pipelines usados em experimentos anteriores com **TheMealDB** e um dataset **CC0 de aproximadamente 64 mil receitas**.

Esses materiais não são tratados automaticamente como catálogo público do site. Conteúdo de terceiros só deve ser publicado quando sua licença ou autorização permitir o uso pretendido.

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
- feed da home;
- fontes externas de receitas.

Rotas relacionadas às fontes:

```text
GET /api/sources
GET /api/recipes?source=wikibooks
GET /api/recipes/:slug
```

A lista de rotas e exemplos está em [`docs/api.md`](docs/api.md).

## Importação de receitas

A importação do Wikilivros é executada manualmente pelo workflow **Importar receitas do Wikilivros**.

O workflow permite selecionar uma categoria culinária autorizada pelo importador e um limite controlado de receitas. O script usa a API do MediaWiki, valida a estrutura da página, normaliza os dados e grava as receitas no D1 mantendo a procedência.

O script principal está em:

```text
backend/worker-prototype/scripts/import-wikibooks.mjs
```

A importação é separada do deploy da API. Alterações no código do Worker publicam a API automaticamente; importar novas receitas é uma ação explícita para evitar que conteúdo externo entre no catálogo sem revisão.

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

O workflow **Deploy API Cloudflare** roda automaticamente quando há mudanças em `backend/worker-prototype/**` na `main`. Antes de publicar o Worker, ele aplica as migrations remotas do D1.

O workflow também continua disponível para execução manual quando necessário.

## Regra de documentação

Mudanças que alterem a **engrenagem do projeto** devem atualizar este README no mesmo PR. Isso inclui principalmente:

- arquitetura;
- API e novas rotas;
- banco e migrations relevantes;
- autenticação;
- importadores e fontes externas;
- deploy e CI;
- integrações externas;
- fluxos principais do produto.

A intenção é manter o README como uma visão fiel do estado atual do Receitando, e não como documentação histórica desatualizada.

## Segurança e informações públicas

Este repositório pode documentar publicamente:

- arquitetura e stack;
- URLs que já são públicas;
- rotas da API;
- estrutura do banco e migrations;
- nomes de bindings e variáveis de ambiente;
- nomes dos secrets usados pelo CI;
- fontes públicas de dados e respectivas licenças.

**Nunca devem ser commitados** valores reais de tokens, chaves de API, credenciais, tokens de sessão, códigos de recuperação, senhas ou dados privados de usuários.

Secrets de produção ficam no GitHub Actions ou na configuração segura da Cloudflare. Arquivos `.env.example` devem conter apenas valores locais ou placeholders.

## Documentação

- [`docs/architecture.md`](docs/architecture.md) — arquitetura atual;
- [`docs/api.md`](docs/api.md) — rotas e autenticação;
- [`docs/database.md`](docs/database.md) — modelo atual do D1;
- [`backend/worker-prototype/README.md`](backend/worker-prototype/README.md) — execução da API Worker.

---

Projeto acadêmico em evolução. A infraestrutura atual usa **GitHub Actions + Cloudflare Workers + D1**.
