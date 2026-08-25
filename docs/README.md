# Documentação do Receitando

Esta pasta reúne a documentação oficial do projeto, separando a visão acadêmica da documentação técnica e operacional.

## Índice

| Documento | Conteúdo |
| --- | --- |
| [`escopo.md`](escopo.md) | problema, objetivo, público-alvo, escopo funcional, requisitos, entregas e critérios de conclusão |
| [`architecture.md`](architecture.md) | arquitetura atual, componentes, autenticação, matching, persistência e fluxo entre frontend/API/D1 |
| [`api.md`](api.md) | rotas da API, autenticação, contratos e exemplos de uso |
| [`database.md`](database.md) | modelo de dados, tabelas e persistência no Cloudflare D1 |
| [`catalogo.md`](catalogo.md) | origem das receitas, Wikilivros, Wikimedia Commons, imagens, licenças e importação |
| [`deploy.md`](deploy.md) | CI, deploy, migrations, operação e ambientes |
| [`estrutura-repositorio.md`](estrutura-repositorio.md) | função de cada pasta, código atual e código histórico |

## Ordem recomendada de leitura

### Para avaliação acadêmica

1. [`escopo.md`](escopo.md)
2. [`architecture.md`](architecture.md)
3. [`catalogo.md`](catalogo.md)
4. [`database.md`](database.md)
5. [`api.md`](api.md)

### Para desenvolvimento

1. [`estrutura-repositorio.md`](estrutura-repositorio.md)
2. [`architecture.md`](architecture.md)
3. [`api.md`](api.md)
4. [`database.md`](database.md)
5. [`deploy.md`](deploy.md)
6. [`catalogo.md`](catalogo.md)

## Organização resumida

```text
receitando/
├── frontend/                     aplicação web em Next.js
├── backend/
│   ├── worker-prototype/         API atual em Cloudflare Workers
│   │   ├── migrations/           migrations do Cloudflare D1
│   │   ├── scripts/              importador atual e utilitários
│   │   └── src/                  código da API
│   ├── src/                      backend NestJS histórico
│   └── prisma/                   schema Prisma histórico
├── docs/                         documentação oficial
├── .github/workflows/            CI, deploy e automações
└── README.md                     visão geral
```

## Guias por componente

- [`../frontend/README.md`](../frontend/README.md) — frontend;
- [`../backend/README.md`](../backend/README.md) — diferença entre backend atual e implementação histórica;
- [`../backend/worker-prototype/README.md`](../backend/worker-prototype/README.md) — API Worker atual.

## Regra de manutenção

A documentação deve acompanhar a implementação.

Quando houver alteração relevante:

- mudança de objetivo ou requisito → atualizar `escopo.md`;
- mudança de componentes ou fluxo → atualizar `architecture.md`;
- mudança de rota → atualizar `api.md`;
- mudança de schema → atualizar `database.md`;
- mudança de fonte/importação → atualizar `catalogo.md`;
- mudança de deploy/CI → atualizar `deploy.md`;
- mudança estrutural no repositório → atualizar `estrutura-repositorio.md`.

O README principal deve continuar sendo uma visão geral e um ponto de entrada, sem duplicar toda a documentação detalhada desta pasta.
