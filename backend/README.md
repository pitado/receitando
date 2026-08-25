# Backend do Receitando

Este diretório contém duas gerações da API do projeto.

## API atual de produção

A API utilizada atualmente está em:

```text
backend/worker-prototype/
```

Ela roda em **Cloudflare Workers** e usa **Cloudflare D1**.

Novas funcionalidades de backend devem ser implementadas nessa estrutura.

Documentação:

- [`worker-prototype/README.md`](worker-prototype/README.md)
- [`../docs/api.md`](../docs/api.md)
- [`../docs/architecture.md`](../docs/architecture.md)
- [`../docs/database.md`](../docs/database.md)

## Implementação histórica

Os arquivos localizados diretamente neste diretório, como:

- `src/`;
- `prisma/`;
- `nest-cli.json`;
- `Dockerfile`;
- configurações de Jest/ESLint/Prettier;
- `package.json` e `package-lock.json` desta raiz;

pertencem à primeira implementação do backend em **NestJS + Prisma + PostgreSQL**.

Essa versão é mantida como referência histórica da evolução do projeto, mas **não é a API usada em produção**.

## Importante para desenvolvimento

Não implemente novas rotas no backend NestJS histórico.

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

## Ambiente de produção

A arquitetura atual é:

```text
Frontend Next.js / Cloudflare Worker
            │
            ▼
      API Cloudflare Worker
            │
            ▼
       Cloudflare D1
```

## Por que o código antigo ainda existe?

Ele registra uma etapa anterior do desenvolvimento e pode ajudar a entender decisões tomadas durante a evolução do projeto.

Enquanto permanecer no repositório, deve ser tratado apenas como histórico e não como fonte oficial da arquitetura atual.

## Referências

- [`../README.md`](../README.md)
- [`../docs/estrutura-repositorio.md`](../docs/estrutura-repositorio.md)
