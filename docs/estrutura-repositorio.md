# Estrutura do repositório

Este documento explica o papel das partes principais do Receitando e separa claramente código de produção, documentação e implementação histórica.

## Visão geral

```text
receitando/
├── .github/
│   ├── ISSUE_TEMPLATE/             templates de bugs e melhorias
│   ├── dependabot.yml              atualizações dos componentes ativos
│   ├── pull_request_template.md    checklist padrão de PR
│   └── workflows/                  CI, deploy e importação de receitas
├── backend/
│   ├── worker-prototype/           API atual de produção
│   │   ├── migrations/             histórico versionado do Cloudflare D1
│   │   ├── scripts/                importador atual do Wikilivros/Commons
│   │   ├── src/                    implementação da API Worker
│   │   └── tests/                  testes automatizados da API
│   ├── prisma/                     implementação histórica
│   └── src/                        implementação histórica em NestJS
├── docs/                           documentação funcional e técnica
├── frontend/                       aplicação Next.js
├── CONTRIBUTING.md                 guia de contribuição
├── SECURITY.md                     política de segurança
├── LICENSE                         licença MIT do código original
├── README.md                       visão geral do projeto
├── docker-compose.yml              apoio apenas ao backend histórico
└── .env.example                    referência de configuração sem secrets reais
```

## `frontend/`

É a aplicação web utilizada pelos usuários, construída com Next.js, React e TypeScript e publicada em Cloudflare Workers por meio do OpenNext.

Responsabilidades principais:

- navegação e interface;
- catálogo e detalhes de receitas;
- matching por ingredientes;
- despensa e favoritos;
- conta, perfil e recuperação de senha;
- comentários e avaliações;
- consumo da API.

Mais detalhes em [`../frontend/README.md`](../frontend/README.md).

## `backend/worker-prototype/`

Apesar do nome histórico, esta é a **API atual de produção**.

O entrypoint efetivamente publicado é definido em `wrangler.jsonc` e atualmente é:

```text
src/auth-rate-limit-worker.ts
```

A API é organizada em uma cadeia de camadas. Cada camada atende seu conjunto de rotas e delega as demais:

```text
auth-rate-limit-worker
        ↓
home-worker
        ↓
catalog64-worker
        ↓
social-worker
        ↓
profile-worker
        ↓
password-reset-worker
        ↓
pantry-worker
        ↓
index
```

Responsabilidades:

- `auth-rate-limit-worker.ts`: proteção contra abuso de login e cadastro;
- `home-worker.ts`: feed da home;
- `catalog64-worker.ts`: fontes, ingredientes, catálogo, detalhe por slug e matching;
- `social-worker.ts`: votos e comentários;
- `profile-worker.ts`: consulta e atualização de perfil;
- `password-reset-worker.ts`: recuperação de senha e Resend;
- `pantry-worker.ts`: despensa e favoritos;
- `index.ts`: cadastro, login, sessão, logout, healthcheck e fallback final;
- `lib/worker-http.ts`: contrato `Env` e helpers HTTP/CORS/autenticação compartilhados, evitando que cada Worker mantenha sua própria cópia da mesma infraestrutura.

Rotas de catálogo/matching que eram duplicadas em `index.ts` foram removidas. A implementação canônica dessas rotas é `catalog64-worker.ts`.

O `typecheck` valida todo o TypeScript em `src/`, não apenas o entrypoint.

### Testes da API

A suíte fica em `backend/worker-prototype/tests/` e é executada com:

```bash
npm test
```

Ela cobre regras de matching, segurança e rate limiting. Testes de rotas/persistência devem acompanhar fluxos críticos à medida que a suíte de integração é ampliada.

## Catálogo e scripts

O único importador operacional mantido na árvore atual é:

```text
backend/worker-prototype/scripts/import-wikibooks-v2.mjs
```

Importadores experimentais substituídos foram removidos da árvore ativa; seu histórico permanece consultável pelo Git. O workflow operacional correspondente é `.github/workflows/import-wikibooks.yml`.

## Código histórico em `backend/`

Os arquivos NestJS/Prisma/PostgreSQL diretamente em `backend/` representam uma implementação anterior e **não fazem parte da produção atual**.

Eles são preservados apenas como referência histórica e não recebem novas funcionalidades nem atualizações automáticas de dependências. Alterações do produto devem ser feitas em `backend/worker-prototype/`.

O `docker-compose.yml` da raiz também pertence a essa implementação histórica.

## `docs/`

Documentação oficial:

- `escopo.md`: definição acadêmica e funcional;
- `funcionalidades.md`: mapa do que está implementado;
- `architecture.md`: arquitetura da solução;
- `api.md`: rotas e contratos;
- `database.md`: modelo do D1 e histórico de migrations;
- `catalogo.md`: origem, licenças e importação;
- `deploy.md`: CI, deploy e operação;
- `estrutura-repositorio.md`: organização do código;
- `README.md`: índice da documentação.

## `.github/workflows/`

Workflows ativos:

- `ci.yml`: valida o frontend;
- `api-worker-ci.yml`: valida a API Worker;
- `deploy-cloudflare.yml`: publica o frontend;
- `deploy-api-cloudflare.yml`: valida, aplica migrations e publica a API;
- `import-wikibooks.yml`: importa manualmente Wikilivros/Commons.

Workflows de importadores substituídos foram removidos, em vez de permanecerem como arquivos que apenas imprimem mensagens de arquivamento.

## Dependabot

O `dependabot.yml` atual acompanha somente:

- `frontend/`;
- `backend/worker-prototype/`.

PRs antigos gerados por configurações anteriores não significam que o backend NestJS continue monitorado; eles pertencem ao histórico do GitHub e devem ser encerrados quando estiverem obsoletos.

## Governança

- `CONTRIBUTING.md`: fluxo de contribuição e validações;
- `SECURITY.md`: reporte responsável de vulnerabilidades;
- `LICENSE`: MIT para o código original do projeto.

A MIT não substitui as licenças das receitas e imagens importadas.

## Arquivos de ambiente

Arquivos `.env.example` podem conter nomes de variáveis e valores locais seguros, nunca tokens, senhas, chaves reais, códigos de recuperação ou dados privados.

## Regra para novas funcionalidades

Ao adicionar uma funcionalidade:

1. alterar o componente ativo correto;
2. criar migration nova quando o schema mudar;
3. atualizar contrato da API e tipos do frontend;
4. incluir teste de regressão/integração adequado ao risco;
5. atualizar a documentação relacionada;
6. remover implementações substituídas em vez de manter código morto;
7. abrir PR e aguardar os checks de CI.

## Documentos relacionados

- [`README.md`](README.md)
- [`funcionalidades.md`](funcionalidades.md)
- [`architecture.md`](architecture.md)
- [`api.md`](api.md)
- [`database.md`](database.md)
- [`deploy.md`](deploy.md)
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
- [`../SECURITY.md`](../SECURITY.md)
