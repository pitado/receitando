# Estrutura do repositório

Este documento explica o papel de cada pasta e arquivo principal do Receitando para evitar confusão entre código atual, documentação e implementações históricas.

## Visão geral

```text
receitando/
├── .github/
│   └── workflows/                 CI, deploy e importação de receitas
├── backend/
│   ├── worker-prototype/          API atual de produção
│   │   ├── migrations/            migrations do Cloudflare D1
│   │   ├── scripts/               importadores e utilitários ativos
│   │   └── src/                   implementação da API Worker
│   ├── prisma/                    implementação histórica
│   └── src/                       implementação histórica em NestJS
├── docs/                          documentação funcional e técnica
├── frontend/
│   ├── public/                    arquivos públicos
│   └── src/                       aplicação Next.js
├── README.md                      visão geral do projeto
└── .env.example                   referência de variáveis sem secrets reais
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

O diretório também contém migrations e o importador atual de receitas.

Mais detalhes em [`../backend/worker-prototype/README.md`](../backend/worker-prototype/README.md).

## Código histórico em `backend/`

Os arquivos de NestJS, Prisma e PostgreSQL localizados diretamente em `backend/` representam uma implementação anterior do projeto.

Eles permanecem no repositório apenas como referência da evolução técnica e **não representam a arquitetura atual de produção**.

Ao desenvolver novas funcionalidades, a API correta é `backend/worker-prototype/`.

Mais detalhes em [`../backend/README.md`](../backend/README.md).

## `docs/`

Documentação oficial do projeto.

Os documentos são divididos entre visão acadêmica e visão técnica:

- `escopo.md`: definição formal do projeto;
- `architecture.md`: arquitetura da solução;
- `api.md`: rotas e contratos da API;
- `database.md`: modelo de dados;
- `catalogo.md`: origem e importação das receitas;
- `deploy.md`: CI, deploy e operação;
- `estrutura-repositorio.md`: este documento.

## `.github/workflows/`

Contém as automações do GitHub Actions.

As rotinas atuais incluem:

- validação do frontend;
- validação da API Worker;
- deploy do frontend;
- deploy da API;
- importação manual do catálogo do Wikilivros.

Workflows antigos de fontes de receitas que não fazem mais parte da estratégia atual devem ser tratados como históricos e não devem ser utilizados para repopular produção.

## Arquivos de ambiente

Arquivos `.env.example` podem conter nomes de variáveis e valores de desenvolvimento que não sejam secretos.

Nunca devem conter:

- chaves de API reais;
- tokens da Cloudflare;
- tokens de sessão;
- senhas;
- credenciais de banco;
- códigos de recuperação;
- dados privados de usuários.

## Regra para novas funcionalidades

Ao adicionar uma funcionalidade:

1. alterar o código no componente correto;
2. criar migration se o banco precisar mudar;
3. atualizar API e tipos quando necessário;
4. atualizar testes/validações;
5. atualizar a documentação relacionada;
6. manter o README principal como visão geral, sem duplicar toda a documentação técnica.

## Regra para arquivos históricos

Código antigo só deve continuar no repositório quando houver motivo claro para preservá-lo.

Se um arquivo histórico permanecer, ele deve estar claramente identificado para não parecer parte da arquitetura atual.

## Documentos relacionados

- [`README.md`](README.md)
- [`architecture.md`](architecture.md)
- [`deploy.md`](deploy.md)
