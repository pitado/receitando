# Receitando

O Receitando responde a uma pergunta simples: **“O que eu consigo cozinhar com o que tenho em casa?”**

A pessoa informa os ingredientes disponíveis, a aplicação compara essa lista com as receitas cadastradas e apresenta os resultados da maior para a menor compatibilidade. Cada resultado indica o percentual compatível, os ingredientes encontrados e o que ainda está faltando.

Este repositório contém a fundação full-stack do projeto acadêmico: catálogo e CRUD de receitas e ingredientes, motor de compatibilidade, interface web, documentação da API e persistência em PostgreSQL. Autenticação, quantidades da despensa, validade, favoritos persistentes e substituições são evoluções previstas, não requisitos desta primeira fase.

## Arquitetura

```text
Navegador
   │
   ▼
Frontend Next.js (:3000)
   │  HTTP/JSON
   ▼
API REST NestJS (:3333/api)
   │
   ▼
Prisma ORM
   │
   ▼
PostgreSQL (:5432)
```

O código é separado em duas aplicações:

- `frontend/`: Next.js, React, TypeScript e App Router;
- `backend/`: NestJS, TypeScript, Prisma, Swagger e Jest;
- `docs/`: decisões de arquitetura, modelo de dados e contrato da API;
- `docker-compose.yml`: PostgreSQL local com volume persistente e healthcheck.

O antigo `index.html` estático foi removido para não competir com a aplicação nova.
O `CNAME` permanece apenas enquanto o domínio ainda aponta para o GitHub Pages. A
aplicação desta fase é o projeto Next.js em `frontend/`.

Mais detalhes estão em [Arquitetura](docs/architecture.md), [Banco de dados](docs/database.md) e [API](docs/api.md).

## Stack

- Frontend: Next.js, React, TypeScript e App Router
- Backend: NestJS, TypeScript, REST, `class-validator` e Swagger/OpenAPI
- Banco e ORM: PostgreSQL e Prisma
- Testes: Jest
- Infraestrutura local: Docker Compose
- Gerenciador de pacotes: npm

## Pré-requisitos

- Node.js 20.9 ou superior
- npm 10 ou superior
- Docker com Docker Compose v2

## Instalação

Na raiz do repositório, instale as dependências bloqueadas de cada aplicação:

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

Crie os arquivos locais de configuração. O `.env` da raiz é lido pelo Docker
Compose, o `backend/.env` pelo NestJS/Prisma e o `frontend/.env.local` pelo Next.js:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

No PowerShell, os comandos equivalentes são:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

Os valores padrão estão preparados para desenvolvimento local. Arquivos `.env` não são versionados.

Variáveis disponíveis:

| Variável | Finalidade | Padrão local |
| --- | --- | --- |
| `POSTGRES_USER` | usuário criado pelo container | `receitando` |
| `POSTGRES_PASSWORD` | senha do PostgreSQL local | `receitando` |
| `POSTGRES_DB` | banco criado pelo container | `receitando` |
| `POSTGRES_PORT` | porta publicada pelo container | `5432` |
| `DATABASE_URL` | conexão usada pelo Prisma | `postgresql://receitando:receitando@localhost:5432/receitando?schema=public` |
| `PORT` | porta HTTP do backend | `3333` |
| `FRONTEND_URL` | origem aceita pelo CORS | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | origem pública do backend (o cliente acrescenta `/api`) | `http://localhost:3333` |

> As credenciais do exemplo são somente para desenvolvimento local. Use segredos fortes e gerenciados em outros ambientes.

## Banco de dados

Suba apenas o PostgreSQL:

```bash
docker compose up -d postgres
```

Confira se o serviço ficou saudável:

```bash
docker compose ps
```

Com o banco disponível, aplique as migrations e carregue os dados iniciais:

```bash
npm --prefix backend run prisma:migrate
npm --prefix backend run prisma:seed
```

Se precisar encerrar os containers sem apagar os dados:

```bash
docker compose down
```

O volume nomeado `receitando-postgres-data` mantém os dados entre reinicializações. `docker compose down -v` também remove esse volume e, portanto, apaga o banco local.

## Executando a aplicação

Use dois terminais:

```bash
# terminal 1
npm --prefix backend run start:dev

# terminal 2
npm --prefix frontend run dev
```

Serviços locais:

- Frontend: <http://localhost:3000>
- API: <http://localhost:3333/api>
- Healthcheck: <http://localhost:3333/api/health>
- Swagger: <http://localhost:3333/api/docs>

## Domínio de produção

O domínio já associado ao projeto é `receitando.miguelpita.com.br`. A topologia
recomendada para publicar as duas aplicações separadamente é:

- frontend: `https://receitando.miguelpita.com.br`;
- API: `https://api.receitando.miguelpita.com.br`;
- Swagger: `https://api.receitando.miguelpita.com.br/api/docs`.

No ambiente do backend, configure:

```dotenv
FRONTEND_URL=https://receitando.miguelpita.com.br
```

No ambiente do frontend, configure:

```dotenv
NEXT_PUBLIC_API_URL=https://api.receitando.miguelpita.com.br
```

Também é possível servir tudo no mesmo domínio. Nesse caso, o proxy da hospedagem
deve encaminhar `https://receitando.miguelpita.com.br/api/*` para o NestJS, e
`NEXT_PUBLIC_API_URL` deve ser `https://receitando.miguelpita.com.br`. O `CNAME`
atual ainda representa a configuração do GitHub Pages; publicar o Next.js e o
NestJS exige configurar a hospedagem e os registros DNS correspondentes.

## Testando o matching

Com backend e banco em execução e o seed aplicado, use a interface da página inicial ou envie uma requisição direta:

```bash
curl -X POST http://localhost:3333/api/recipes/match \
  -H "Content-Type: application/json" \
  -d '{"ingredients":["ovo","banana","farinha de trigo","leite"]}'
```

No PowerShell:

```powershell
$body = @{ ingredients = @('ovo', 'banana', 'farinha de trigo', 'leite') } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3333/api/recipes/match' -ContentType 'application/json' -Body $body
```

A API normaliza maiúsculas, espaços e acentos, considera somente ingredientes obrigatórios no cálculo e ordena os resultados pelo maior percentual.

## Qualidade e testes

Execute as verificações em cada aplicação:

```bash
npm --prefix backend run lint
npm --prefix backend test
npm --prefix backend run build

npm --prefix frontend run lint
npm --prefix frontend run build
```

Os testes unitários do backend cobrem o motor de compatibilidade e sua normalização. Para conhecer e exercitar todos os endpoints, abra o Swagger.

## Funcionalidades desta fase

- CRUD REST de ingredientes e receitas;
- busca de receita por identificador e por slug;
- motor de matching com percentual, ingredientes encontrados e faltantes;
- seed com ingredientes, receitas e seus relacionamentos;
- home com entrada de ingredientes e resultados ordenados;
- catálogo e detalhes de receitas;
- estruturas iniciais de despensa e favoritos;
- validação de payloads, respostas HTTP adequadas, CORS e Swagger;
- PostgreSQL local persistente via Docker Compose.

## Próximas evoluções

1. Autenticação e autorização de usuários.
2. Despensa persistente com quantidade e validade.
3. Favoritos, histórico e preferências.
4. Substituições e equivalências de ingredientes.
5. Priorização de alimentos próximos do vencimento.

Consulte também o [contrato da API](docs/api.md) antes de integrar novos clientes.
