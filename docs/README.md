# Documentação do Receitando

Esta pasta reúne a documentação oficial do projeto, separando escopo acadêmico, estado funcional, arquitetura, contratos e operação.

## Índice

| Documento | Conteúdo |
| --- | --- |
| [`escopo.md`](escopo.md) | problema, objetivo, público-alvo, requisitos, entregas e critérios de conclusão |
| [`funcionalidades.md`](funcionalidades.md) | funcionalidades efetivamente implementadas |
| [`architecture.md`](architecture.md) | arquitetura atual, entrypoint, cadeia de Workers e fluxo frontend/API/D1 |
| [`api.md`](api.md) | mapa completo de rotas, autenticação, matching e contratos |
| [`database.md`](database.md) | tabelas, integridade, índices, FTS5, migrations e histórico do D1 |
| [`catalogo.md`](catalogo.md) | Wikilivros, Commons, licenças, sanitização, importação e canonicalização |
| [`testes.md`](testes.md) | estratégia, ferramentas, cobertura e testes de integração |
| [`deploy.md`](deploy.md) | CI, deploy, migrations, operação e ambientes |
| [`estrutura-repositorio.md`](estrutura-repositorio.md) | função de cada pasta e código atual |

Arquivos de governança/histórico na raiz:

- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — contribuição e validações;
- [`../SECURITY.md`](../SECURITY.md) — reporte responsável e práticas de segurança;
- [`../CHANGELOG.md`](../CHANGELOG.md) — decisões estruturais e correções relevantes;
- [`../LICENSE`](../LICENSE) — MIT para o código original.

## Ordem recomendada

### Avaliação acadêmica

1. [`escopo.md`](escopo.md)
2. [`funcionalidades.md`](funcionalidades.md)
3. [`architecture.md`](architecture.md)
4. [`catalogo.md`](catalogo.md)
5. [`database.md`](database.md)
6. [`api.md`](api.md)
7. [`testes.md`](testes.md)
8. [`deploy.md`](deploy.md)

### Desenvolvimento

1. [`estrutura-repositorio.md`](estrutura-repositorio.md)
2. [`architecture.md`](architecture.md)
3. [`api.md`](api.md)
4. [`database.md`](database.md)
5. [`testes.md`](testes.md)
6. [`deploy.md`](deploy.md)
7. [`catalogo.md`](catalogo.md)
8. [`../CONTRIBUTING.md`](../CONTRIBUTING.md)

## Estrutura resumida

```text
receitando/
├── frontend/                       aplicação Next.js + testes
├── backend/
│   ├── README.md
│   └── worker-prototype/           API atual em Cloudflare Workers
│       ├── migrations/             histórico do D1
│       ├── scripts/                importação + canonicalização
│       ├── src/                    Workers e bibliotecas
│       └── tests/                  regras + integração de rotas
├── docs/                           documentação oficial
├── .github/                        CI, deploy, Dependabot e templates
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── LICENSE
└── README.md
```

A implementação anterior em NestJS/Prisma/PostgreSQL não fica mais na árvore principal. Ela foi preservada na branch `legacy/nest-prisma`.

## Guias por componente

- [`../frontend/README.md`](../frontend/README.md) — frontend;
- [`../backend/README.md`](../backend/README.md) — backend atual e referência ao arquivo legado;
- [`../backend/worker-prototype/README.md`](../backend/worker-prototype/README.md) — API Worker;
- [`../backend/worker-prototype/scripts/README.md`](../backend/worker-prototype/scripts/README.md) — scripts operacionais do catálogo.

## Fonte de verdade

- comportamento implementado → `funcionalidades.md`;
- contrato HTTP → `api.md`;
- entrypoint/fluxo técnico → `architecture.md`;
- schema, integridade e índices → `database.md`;
- fonte/licenças/importação → `catalogo.md`;
- qualidade → `testes.md`;
- CI/operação → `deploy.md`.

O README da raiz é a visão consolidada. Detalhes técnicos devem permanecer nos documentos específicos para evitar versões contraditórias.

## Regra de manutenção

Quando houver alteração relevante:

- objetivo/requisito → `escopo.md`;
- funcionalidade → `funcionalidades.md`;
- componente/entrypoint/fluxo → `architecture.md` e `estrutura-repositorio.md`;
- rota/contrato → `api.md`;
- schema/migration/índice → `database.md`;
- importador/licença/canonicalização → `catalogo.md`;
- teste/cobertura → `testes.md`;
- CI/deploy → `deploy.md`;
- decisão estrutural histórica → `CHANGELOG.md`;
- segurança → `SECURITY.md`.

Documentação e implementação devem ser alteradas no mesmo PR quando uma mudança tornar o texto anterior incorreto.
