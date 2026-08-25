# Estrutura do repositório

Este documento explica o papel de cada pasta e arquivo principal do Receitando para evitar confusão entre código atual, documentação e implementações históricas.

## Visão geral

```text
receitando/
├── .github/
│   ├── dependabot.yml              atualizações dos componentes em uso
│   └── workflows/                  CI, deploy e importação de receitas
├── backend/
│   ├── worker-prototype/           API atual de produção
│   │   ├── migrations/             migrations do Cloudflare D1
│   │   ├── scripts/                importador atual + scripts históricos documentados
│   │   └── src/                    implementação da API Worker
│   ├── prisma/                     implementação histórica
│   └── src/                        implementação histórica em NestJS
├── docs/                           documentação funcional e técnica
├── frontend/
│   ├── public/                     arquivos públicos
│   └── src/                        aplicação Next.js
├── README.md                       visão geral do projeto
├── docker-compose.yml              apoio apenas ao backend histórico
└── .env.example                    referência do ambiente atual sem secrets reais
```

## `frontend/`

É a aplicação web utilizada pelos usuários.

Tecnologias principais:

- Next.js 16;
- React 19;
- TypeScript;
- App Router;
- OpenNext;
- Cloudflare Workers.

Responsabilidades:

- interface do usuário;
- navegação;
- autenticação no cliente;
- catálogo de receitas;
- busca e combinação por ingredientes;
- despensa;
- favoritos;
- perfil;
- comentários e avaliações;
- consumo da API.

Mais detalhes em [`../frontend/README.md`](../frontend/README.md).

## `backend/worker-prototype/`

Apesar do nome histórico, esta é a **API atual de produção**.

Ela concentra:

- autenticação;
- sessões;
- perfil;
- catálogo;
- ingredientes;
- matching de receitas;
- despensa;
- favoritos;
- recuperação de senha;
- feed;
- votos;
- comentários;
- acesso ao Cloudflare D1.

O ponto de entrada de produção é `src/home-worker.ts`. Os Workers atuais são encadeados até `src/index.ts`, e o `typecheck` valida todo o código TypeScript presente em `src/`.

O diretório também contém migrations e os scripts de catálogo. O script operacional atual é `scripts/import-wikibooks-v2.mjs`; scripts de bases anteriores permanecem somente como histórico e estão explicados em `scripts/README.md`.

Mais detalhes em:

- [`../backend/worker-prototype/README.md`](../backend/worker-prototype/README.md)
- [`../backend/worker-prototype/scripts/README.md`](../backend/worker-prototype/scripts/README.md)

## Código histórico em `backend/`

Os arquivos de NestJS, Prisma e PostgreSQL localizados diretamente em `backend/` representam uma implementação anterior do projeto.

Eles permanecem no repositório apenas como referência da evolução técnica e **não representam a arquitetura atual de produção**.

Ao desenvolver novas funcionalidades, a API correta é `backend/worker-prototype/`.

O `docker-compose.yml` da raiz também pertence a esse ambiente histórico PostgreSQL e não é necessário para executar a API Worker atual.

Mais detalhes em [`../backend/README.md`](../backend/README.md).

## `docs/`

Documentação oficial do projeto.

Os documentos são divididos entre visão acadêmica, funcional e técnica:

- `escopo.md`: definição formal do projeto;
- `funcionalidades.md`: mapa do que está implementado;
- `architecture.md`: arquitetura da solução;
- `api.md`: rotas e contratos da API;
- `database.md`: modelo de dados;
- `catalogo.md`: origem, licenças e importação das receitas;
- `deploy.md`: CI, deploy e operação;
- `estrutura-repositorio.md`: este documento;
- `README.md`: índice e ordem recomendada de leitura.

## `.github/workflows/`

Contém as automações do GitHub Actions.

### Workflows atuais

- `ci.yml`: valida o frontend;
- `api-worker-ci.yml`: valida a API Worker;
- `deploy-cloudflare.yml`: publica o frontend;
- `deploy-api-cloudflare.yml`: valida, aplica migrations e publica a API;
- `import-wikibooks.yml`: importa manualmente o catálogo do Wikilivros/Commons.

### Workflow arquivado

`import-recipes-64k.yml` está mantido apenas para registrar um experimento anterior. Ele não importa dados para produção e exibe uma mensagem orientando o uso do importador atual.

## Dependabot

O Dependabot acompanha apenas os componentes em uso:

- `frontend/`;
- `backend/worker-prototype/`.

O backend NestJS histórico não recebe atualizações automáticas para não gerar a impressão de que ele ainda faz parte da arquitetura ativa.

## Arquivos de ambiente

Arquivos `.env.example` podem conter nomes de variáveis e valores de desenvolvimento que não sejam secretos.

Nunca devem conter:

- chaves de API reais;
- tokens da Cloudflare;
- tokens de sessão;
- senhas reais;
- credenciais reais de banco;
- códigos de recuperação;
- dados privados de usuários.

O `.env.example` da raiz descreve a configuração atual. O arquivo `backend/.env.example` pertence somente ao backend histórico e está identificado dessa forma.

## Regra para novas funcionalidades

Ao adicionar uma funcionalidade:

1. alterar o código no componente correto;
2. criar migration nova se o banco precisar mudar;
3. atualizar API e tipos quando necessário;
4. atualizar testes e validações;
5. atualizar `funcionalidades.md` e os documentos técnicos relacionados;
6. manter o README principal como visão geral, sem duplicar toda a documentação técnica.

## Regra para arquivos históricos

Código antigo só deve continuar no repositório quando houver motivo claro para preservá-lo.

Se um arquivo histórico permanecer, ele deve estar claramente identificado para não parecer parte da arquitetura atual. Arquivos obsoletos que estavam misturados ao código Worker atual foram removidos para manter `backend/worker-prototype/src/` restrito à implementação em uso.

## Documentos relacionados

- [`README.md`](README.md)
- [`funcionalidades.md`](funcionalidades.md)
- [`architecture.md`](architecture.md)
- [`deploy.md`](deploy.md)
