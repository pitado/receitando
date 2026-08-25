# Receitando

O **Receitando** é um projeto acadêmico de aplicação web para descobrir receitas a partir dos ingredientes que a pessoa já possui.

A proposta central é simples: o usuário informa ingredientes manualmente ou mantém uma despensa vinculada à conta, e o sistema compara esses itens com o catálogo para priorizar receitas por compatibilidade, mostrando o que já está disponível e o que ainda falta.

> A definição formal do projeto está em [`docs/escopo.md`](docs/escopo.md).

## Acesso

- Site: **https://receitando.miguelpita.com.br**
- API: **https://api.receitando.miguelpita.com.br**

## Visão do projeto

O Receitando reúne quatro áreas principais:

1. **descoberta de receitas** por catálogo e busca;
2. **matching por ingredientes**, incluindo uso da despensa do usuário;
3. **conta e personalização**, com autenticação, perfil, favoritos e recuperação de senha;
4. **interação da comunidade**, com avaliações, comentários e feed.

O catálogo atual utiliza conteúdo aberto do **Wikilivros em português** e imagens livres do **Wikimedia Commons**, preservando no backend informações de origem e licença quando aplicável.

## Funcionalidades implementadas

- catálogo e detalhes de receitas;
- busca de receitas por ingredientes;
- cálculo de compatibilidade;
- indicação de ingredientes encontrados e faltantes;
- combinação usando a despensa do usuário;
- cadastro, login, logout e sessão persistente;
- perfil editável com nome, `@` e avatar;
- recuperação de senha por código enviado por e-mail;
- despensa persistente;
- quantidades e unidades opcionais na despensa;
- favoritos persistentes;
- avaliações de receita com gostei/não gostei;
- comentários por receita;
- feed da home com dados da comunidade;
- página 404 personalizada;
- estados de loading e erro;
- importação de receitas abertas com imagem e procedência registrada.

O mapa detalhado do que já existe está em [`docs/funcionalidades.md`](docs/funcionalidades.md).

## Arquitetura atual

```text
Usuário / navegador
        │
        ▼
Next.js + React
OpenNext / Cloudflare Worker
        │
        │ HTTP + JSON
        ▼
API Cloudflare Worker
        │
        ├── Cloudflare D1
        └── Resend
```

O frontend e a API são publicados separadamente. O frontend não acessa o banco diretamente: leitura e escrita persistente passam pela API.

Mais detalhes em [`docs/architecture.md`](docs/architecture.md).

## Estrutura do repositório

```text
receitando/
├── frontend/                     aplicação web Next.js
├── backend/
│   ├── worker-prototype/         API atual de produção
│   │   ├── migrations/           migrations do Cloudflare D1
│   │   ├── scripts/              importador atual + scripts históricos documentados
│   │   └── src/                  código atual da API Worker
│   ├── src/                      backend NestJS histórico
│   └── prisma/                   persistência Prisma histórica
├── docs/                         documentação oficial
├── .github/workflows/            CI, deploy e automações
└── README.md                     visão geral
```

**Importante:** apesar do nome `worker-prototype`, esse diretório contém a API atual de produção. Os arquivos NestJS/Prisma diretamente em `backend/` são históricos.

A explicação completa está em [`docs/estrutura-repositorio.md`](docs/estrutura-repositorio.md).

## Stack

### Frontend

- Next.js 16;
- React 19;
- TypeScript;
- App Router;
- OpenNext;
- Cloudflare Workers.

### API e persistência

- Cloudflare Workers;
- TypeScript;
- Wrangler;
- Cloudflare D1;
- Web Crypto API;
- Resend para recuperação de senha.

### Automação e infraestrutura

- GitHub Actions;
- Cloudflare Workers;
- Cloudflare D1;
- CI separado para frontend e API;
- deploy separado de frontend e API;
- workflow manual para importação do catálogo.

## Catálogo de receitas

A fonte oficial atual do catálogo é:

- **Wikilivros em português** para texto e estrutura das receitas;
- **Wikimedia Commons** para imagens livres.

O importador atual:

- descobre páginas de receitas;
- interpreta ingredientes e modo de preparo;
- procura imagens relacionadas;
- usa busca controlada no Commons como fallback;
- preserva metadados de origem, autoria e licença no D1;
- respeita rate limits e trata respostas `429`/`5xx`;
- grava dados no D1 em lotes.

Documentação completa: [`docs/catalogo.md`](docs/catalogo.md).

## API

A API usa JSON e prefixo `/api`.

Rotas autenticadas utilizam:

```text
Authorization: Bearer <token-da-sessao>
```

Áreas principais:

- autenticação e perfil;
- recuperação de senha;
- fontes do catálogo;
- ingredientes;
- catálogo;
- matching;
- despensa;
- favoritos;
- avaliações e comentários;
- feed da home.

Rotas e exemplos: [`docs/api.md`](docs/api.md).

## Banco de dados

A produção utiliza **Cloudflare D1**.

As migrations ficam em:

```text
backend/worker-prototype/migrations/
```

O modelo inclui contas, sessões, ingredientes, receitas, relações entre receitas e ingredientes, aliases, despensa, favoritos, recuperação de senha, perfis, votos, comentários e metadados de fontes e imagens externas.

Detalhes: [`docs/database.md`](docs/database.md).

## Desenvolvimento local

### Pré-requisitos

- Node.js 20.9 ou superior;
- npm 10 ou superior.

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Crie `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8787
```

A aplicação fica normalmente em:

```text
http://localhost:3000
```

Guia específico: [`frontend/README.md`](frontend/README.md).

### API Worker + D1

```bash
cd backend/worker-prototype
npm ci
npm run migrate:local
npm run dev
```

A API local fica normalmente em:

```text
http://localhost:8787
```

Guia específico: [`backend/worker-prototype/README.md`](backend/worker-prototype/README.md).

## Qualidade

Frontend:

```bash
cd frontend
npm run lint
npm run typecheck
npm run build
```

API:

```bash
cd backend/worker-prototype
npm run typecheck
npm run dry-run
```

O `typecheck` da API cobre a cadeia TypeScript atual em `backend/worker-prototype/src/`. O CI oficial valida frontend e API Worker atuais; o backend NestJS histórico não faz parte da validação principal de produção.

## Deploy

O frontend e a API possuem workflows separados.

Antes do deploy, o frontend passa por lint/typecheck/build e a API passa por typecheck/dry-run. A API aplica migrations remotas somente depois dessas validações. A importação de receitas é independente do deploy e é executada manualmente.

Guia operacional: [`docs/deploy.md`](docs/deploy.md).

## Segurança

Podem ser documentados publicamente:

- arquitetura e stack;
- URLs públicas;
- rotas da API;
- schema e migrations;
- nomes de bindings;
- nomes de variáveis de ambiente e secrets.

Nunca devem ser commitados:

- tokens reais;
- chaves de API;
- senhas;
- tokens de sessão;
- códigos de recuperação;
- credenciais de produção;
- dados privados de usuários.

Arquivos `.env.example` devem conter somente placeholders ou valores locais seguros.

## Documentação

O índice completo está em [`docs/README.md`](docs/README.md).

Principais documentos:

- [`docs/escopo.md`](docs/escopo.md) — definição acadêmica e funcional;
- [`docs/funcionalidades.md`](docs/funcionalidades.md) — funcionalidades já implementadas;
- [`docs/architecture.md`](docs/architecture.md) — arquitetura atual;
- [`docs/api.md`](docs/api.md) — rotas e contratos da API;
- [`docs/database.md`](docs/database.md) — modelo do D1;
- [`docs/catalogo.md`](docs/catalogo.md) — receitas, imagens e licenças;
- [`docs/deploy.md`](docs/deploy.md) — CI, deploy e operação;
- [`docs/estrutura-repositorio.md`](docs/estrutura-repositorio.md) — organização do código;
- [`frontend/README.md`](frontend/README.md) — guia do frontend;
- [`backend/README.md`](backend/README.md) — backend atual versus histórico;
- [`backend/worker-prototype/README.md`](backend/worker-prototype/README.md) — guia da API atual;
- [`backend/worker-prototype/scripts/README.md`](backend/worker-prototype/scripts/README.md) — scripts atuais e históricos.

---

Projeto acadêmico em evolução, com infraestrutura atual baseada em **GitHub Actions + Cloudflare Workers + Cloudflare D1**.
