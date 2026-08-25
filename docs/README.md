# Documentação do Receitando

Esta pasta reúne a documentação oficial do projeto, separando a visão acadêmica da documentação técnica e operacional.

## Índice

| Documento | Conteúdo |
| --- | --- |
| [`escopo.md`](escopo.md) | problema, objetivo, público-alvo, escopo funcional, requisitos, entregas e critérios de conclusão |
| [`funcionalidades.md`](funcionalidades.md) | funcionalidades já implementadas e relação entre as áreas do sistema |
| [`architecture.md`](architecture.md) | arquitetura atual, componentes, autenticação, matching, persistência e fluxo entre frontend/API/D1 |
| [`api.md`](api.md) | rotas da API, autenticação, contratos e exemplos de uso |
| [`database.md`](database.md) | modelo de dados, tabelas e persistência no Cloudflare D1 |
| [`catalogo.md`](catalogo.md) | origem das receitas, Wikilivros, Wikimedia Commons, imagens, licenças e importação |
| [`testes.md`](testes.md) | estratégia de testes, ferramentas, cobertura, cenários e limites atuais |
| [`deploy.md`](deploy.md) | CI, testes automatizados, deploy, migrations, operação e ambientes |
| [`estrutura-repositorio.md`](estrutura-repositorio.md) | função de cada pasta, código atual, testes e código histórico |

Arquivos de governança na raiz:

- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — fluxo de contribuição e validações;
- [`../SECURITY.md`](../SECURITY.md) — reporte responsável de vulnerabilidades;
- [`../LICENSE`](../LICENSE) — licença MIT do código original.

## Ordem recomendada de leitura

### Para avaliação acadêmica

1. [`escopo.md`](escopo.md)
2. [`funcionalidades.md`](funcionalidades.md)
3. [`architecture.md`](architecture.md)
4. [`catalogo.md`](catalogo.md)
5. [`database.md`](database.md)
6. [`api.md`](api.md)
7. [`testes.md`](testes.md)
8. [`deploy.md`](deploy.md)

### Para desenvolvimento

1. [`estrutura-repositorio.md`](estrutura-repositorio.md)
2. [`architecture.md`](architecture.md)
3. [`funcionalidades.md`](funcionalidades.md)
4. [`api.md`](api.md)
5. [`database.md`](database.md)
6. [`testes.md`](testes.md)
7. [`deploy.md`](deploy.md)
8. [`catalogo.md`](catalogo.md)
9. [`../CONTRIBUTING.md`](../CONTRIBUTING.md)

## Organização resumida

```text
receitando/
├── frontend/                     aplicação web em Next.js + testes Vitest/RTL
├── backend/
│   ├── worker-prototype/         API atual em Cloudflare Workers
│   │   ├── migrations/           migrations do Cloudflare D1
│   │   ├── scripts/              importador atual + scripts históricos documentados
│   │   ├── src/                  código atual da API
│   │   └── tests/                helpers + testes de rotas dos Workers
│   ├── src/                      backend NestJS histórico
│   └── prisma/                   schema Prisma histórico
├── docs/                         documentação oficial
├── .github/                      CI, deploy, Dependabot e templates
├── CONTRIBUTING.md               guia de contribuição
├── SECURITY.md                   política de segurança
├── LICENSE                       licença MIT
└── README.md                     visão geral
```

## Guias por componente

- [`../frontend/README.md`](../frontend/README.md) — frontend, testes e cobertura;
- [`../backend/README.md`](../backend/README.md) — diferença entre backend atual e implementação histórica;
- [`../backend/worker-prototype/README.md`](../backend/worker-prototype/README.md) — API Worker atual e suíte de testes;
- [`../backend/worker-prototype/scripts/README.md`](../backend/worker-prototype/scripts/README.md) — script operacional e scripts históricos.

## Qualidade

Os dois componentes ativos possuem testes automatizados. O frontend utiliza Vitest + React Testing Library, mede cobertura com V8 e executa `test:coverage` no CI e antes do deploy. A API usa `node:test` para helpers e para contratos de rotas dos Workers com D1 simulado, além de typecheck e dry-run.

A estratégia completa está em [`testes.md`](testes.md). A ordem operacional das validações está em [`deploy.md`](deploy.md).

## Regra de manutenção

A documentação deve acompanhar a implementação.

Quando houver alteração relevante:

- mudança de objetivo ou requisito → atualizar `escopo.md`;
- nova funcionalidade ou alteração de comportamento → atualizar `funcionalidades.md`;
- mudança de componentes ou fluxo → atualizar `architecture.md`;
- mudança de rota → atualizar `api.md`;
- mudança de schema → atualizar `database.md`;
- mudança de fonte/importação → atualizar `catalogo.md`;
- mudança de estratégia/cobertura de testes → atualizar `testes.md`;
- mudança de deploy/CI → atualizar `deploy.md`;
- mudança estrutural no repositório → atualizar `estrutura-repositorio.md`;
- mudança no fluxo de colaboração → atualizar `CONTRIBUTING.md`;
- mudança no procedimento de segurança → atualizar `SECURITY.md`.

O README principal deve continuar sendo uma visão geral e um ponto de entrada, sem duplicar toda a documentação detalhada desta pasta.
