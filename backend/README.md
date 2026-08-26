# Backend do Receitando

Este diretório contém apenas a implementação oficial atual da API do Receitando.

## API de produção

A API está em:

```text
backend/worker-prototype/
```

Ela roda em **Cloudflare Workers** e usa **Cloudflare D1** para persistência.

Novas funcionalidades de backend devem ser implementadas nessa estrutura.

## Estrutura

```text
backend/
├── README.md
└── worker-prototype/
    ├── migrations/    migrations do D1
    ├── scripts/       importador do Wikilivros/Commons
    ├── src/           Workers e bibliotecas da API
    ├── tests/         testes automatizados
    ├── package.json
    └── wrangler.jsonc
```

## Código NestJS/Prisma antigo

A primeira implementação do projeto em **NestJS + Prisma + PostgreSQL** foi retirada da árvore principal para não confundir desenvolvimento, CI ou avaliação acadêmica.

Ela permanece preservada na branch:

```text
legacy/nest-prisma
```

A branch `main` deve representar apenas a arquitetura atual depois que esta limpeza for mesclada.

## Ambiente de produção

```text
Frontend Next.js / Cloudflare Worker
            │
            ▼
      API Cloudflare Worker
            │
            ▼
       Cloudflare D1
```

## Desenvolvimento

Use:

```text
backend/worker-prototype/src/
```

Migrations atuais:

```text
backend/worker-prototype/migrations/
```

Scripts de catálogo atuais:

```text
backend/worker-prototype/scripts/
```

## Documentação

- [`worker-prototype/README.md`](worker-prototype/README.md)
- [`../docs/api.md`](../docs/api.md)
- [`../docs/architecture.md`](../docs/architecture.md)
- [`../docs/database.md`](../docs/database.md)
- [`../docs/estrutura-repositorio.md`](../docs/estrutura-repositorio.md)
