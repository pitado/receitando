# Scripts do backend Receitando

Os scripts operacionais atuais usam **PostgreSQL** ou testam recursos isolados. O banco de produção é Neon PostgreSQL conectado via Cloudflare Hyperdrive.

- `test-postgres-schema.mjs`: testa banco relacional local e rotas reais, somente em `localhost`.
- `test-cooking-rooms.mjs`: inicia Worker local e verifica dois WebSockets sem acessar usuários de produção.
- `import-external-references.mjs`: valida links brasileiros e, somente com `--apply` e permissão explícita, salva referências no PostgreSQL especificado.
- `external-references-br.json`: catálogo de URLs e metadados de atribuição, não conteúdo protegido copiado.

Não executar benchmarks, fixtures nem importações de desenvolvimento contra a branch de produção. Credenciais ficam em secrets, nunca no repositório. [Schema](../migrations/postgres/0001_baseline.sql) · [Testes](../../../tests/load/README.md).
