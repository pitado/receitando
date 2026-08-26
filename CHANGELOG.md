# Changelog técnico

Este arquivo registra mudanças estruturais ou operacionais relevantes que ajudam a explicar decisões não óbvias do histórico do projeto.

## 2026-08 — auditoria estrutural

- consolidada a API atual em torno do entrypoint `auth-rate-limit-worker.ts`;
- removidas implementações duplicadas/mortas de catálogo e matching em `index.ts` e `pantry-worker.ts`;
- centralizados helpers HTTP/CORS/autenticação em `src/lib/worker-http.ts`;
- removida a camada `password-reset-validation-worker.ts`, que contrariava a resposta genérica do fluxo de recuperação e permitia distinguir contas inexistentes;
- expostos metadados completos de atribuição de imagem no contrato público e no detalhe da receita;
- removidas dependências PostgreSQL/Prisma órfãs da API D1;
- removidos importadores/workflow experimentais já substituídos;
- restaurados testes automatizados de frontend e ampliados testes de integração dos Workers;
- documentação sincronizada com as rotas, entrypoint e funcionalidades atuais.

## Histórico da migration `0008b`

`0008b_prepare_catalog_v3b.sql` é uma migration intermediária intencional adicionada antes de `0009_seed_catalog_v3b.sql`.

Ela prepara IDs/slugs alternativos para duas receitas que colidiam com registros já existentes na expansão v3b. A escolha preserva URLs e relacionamentos existentes, como favoritos e comentários, em vez de substituir registros antigos.

O nome `0008b` faz parte do histórico de migrations já compartilhado e não deve ser renumerado retroativamente.

Mais detalhes: [`docs/database.md`](docs/database.md).
