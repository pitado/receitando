# Changelog técnico

Este arquivo registra mudanças estruturais ou operacionais relevantes que ajudam a explicar decisões não óbvias do histórico do projeto.

## 2026-08 — auditoria estrutural

- consolidada a API atual em torno do entrypoint `session-cookie-worker.ts`, que aplica sessão/CORS/Origin e delega o roteamento ao `app-router.ts`;
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

## Colisão histórica do prefixo `0013`

Existem duas migrations já compartilhadas que usam o prefixo `0013`:

- `0013_recipe_image_attribution.sql`;
- `0013_recipe_submissions.sql`.

A primeira adiciona metadados de atribuição das imagens das receitas. A segunda cria a tabela `recipe_submissions` usada pelo envio de receitas da comunidade.

Essa colisão de prefixo faz parte do histórico já compartilhado e **não deve ser corrigida por renumeração retroativa**. Migrations novas devem continuar usando nomes inéditos; a moderação das submissões, por exemplo, foi adicionada posteriormente em `0016_recipe_submission_moderation.sql`.

Mais detalhes: [`docs/database.md`](docs/database.md).
