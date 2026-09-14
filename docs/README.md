# Documentação do Receitando

Esta pasta reúne a documentação oficial do projeto, separando escopo acadêmico, estado funcional, arquitetura, contratos e operação.

## Índice

| Documento | Conteúdo |
| --- | --- |
| [`escopo.md`](escopo.md) | problema, objetivo, público-alvo, requisitos, entregas e critérios de conclusão |
| [`glossario.md`](glossario.md) | termos de negócio, produto, requisitos, arquitetura, banco, segurança e catálogo externo |
| [`funcionalidades.md`](funcionalidades.md) | funcionalidades efetivamente implementadas |
| [`architecture.md`](architecture.md) | arquitetura atual, entrypoint, cadeia de Workers e fluxo frontend/API/D1/R2 |
| [`api.md`](api.md) | mapa completo de rotas, autenticação, catálogo v2, matching, submissões e moderação |
| [`database.md`](database.md) | tabelas, integridade, índices, FTS5, migrations e histórico do D1 |
| [`catalogo.md`](catalogo.md) | Wikilivros, Commons, licenças, sanitização, importação e canonicalização |
| [`motor-adaptacao.md`](motor-adaptacao.md) | motor de adaptação, quantidades, contexto culinário e substituições |
| [`mobile-upload-login.md`](mobile-upload-login.md) | fluxo de envio de receita/foto e acesso à conta em mobile |
| [`testes.md`](testes.md) | estratégia, ferramentas, cobertura e testes de integração |
| [`deploy.md`](deploy.md) | CI, deploy, migrations, operação e ambientes |
| [`estrutura-repositorio.md`](estrutura-repositorio.md) | função de cada pasta e código atual |

Arquivos de requisitos e casos de uso mantidos na raiz para ficarem visíveis no repositório:

- [`../receitando-requisitos.md`](../receitando-requisitos.md) — requisitos funcionais, não funcionais e regras de negócio;
- [`../receitando-casos-de-uso.md`](../receitando-casos-de-uso.md) — atores, diagrama, especificações e rastreabilidade.

Arquivos de governança/histórico na raiz:

- [`../AUTHORS.md`](../AUTHORS.md) — autoria e participantes;
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — contribuição e validações;
- [`../SECURITY.md`](../SECURITY.md) — reporte responsável e práticas de segurança;
- [`../CHANGELOG.md`](../CHANGELOG.md) — decisões estruturais e correções relevantes;
- [`../LICENSE`](../LICENSE) — GNU AGPLv3 para o código original.

## Ordem recomendada

### Avaliação acadêmica

1. [`escopo.md`](escopo.md)
2. [`../receitando-requisitos.md`](../receitando-requisitos.md)
3. [`../receitando-casos-de-uso.md`](../receitando-casos-de-uso.md)
4. [`glossario.md`](glossario.md)
5. [`funcionalidades.md`](funcionalidades.md)
6. [`architecture.md`](architecture.md)
7. [`catalogo.md`](catalogo.md)
8. [`database.md`](database.md)
9. [`api.md`](api.md)
10. [`testes.md`](testes.md)
11. [`deploy.md`](deploy.md)

### Desenvolvimento

1. [`estrutura-repositorio.md`](estrutura-repositorio.md)
2. [`architecture.md`](architecture.md)
3. [`api.md`](api.md)
4. [`database.md`](database.md)
5. [`motor-adaptacao.md`](motor-adaptacao.md)
6. [`mobile-upload-login.md`](mobile-upload-login.md)
7. [`testes.md`](testes.md)
8. [`deploy.md`](deploy.md)
9. [`catalogo.md`](catalogo.md)
10. [`glossario.md`](glossario.md)
11. [`../CONTRIBUTING.md`](../CONTRIBUTING.md)

## Estrutura resumida

```text
receitando/
├── frontend/                       aplicação Next.js + testes
│   └── e2e/                        suíte Playwright
├── backend/
│   ├── README.md
│   └── worker-prototype/           API atual em Cloudflare Workers
│       ├── migrations/             histórico do D1
│       ├── scripts/                importação + canonicalização
│       ├── src/                    Workers e bibliotecas
│       └── tests/                  regras + integração de rotas
├── docs/                           documentação oficial
├── .github/                        CI, deploy, Dependabot e templates
├── AUTHORS.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
├── receitando-requisitos.md
├── receitando-casos-de-uso.md
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

- objetivo, requisitos e critérios acadêmicos → `escopo.md` e os documentos de requisitos/casos de uso da raiz;
- vocabulário e significado dos termos → `glossario.md`;
- comportamento implementado → `funcionalidades.md`;
- contrato HTTP → `api.md`;
- entrypoint/fluxo técnico → `architecture.md`;
- schema, integridade e índices → `database.md`;
- fonte/licenças/importação → `catalogo.md`;
- adaptação/substituições → `motor-adaptacao.md`;
- fluxo específico de upload/login mobile → `mobile-upload-login.md`;
- qualidade → `testes.md`;
- CI/operação → `deploy.md`.

O README da raiz é a visão consolidada. Detalhes técnicos devem permanecer nos documentos específicos para evitar versões contraditórias.

## Regra de manutenção

Quando houver alteração relevante:

- objetivo/requisito → `escopo.md` e, quando aplicável, os documentos de requisitos/casos de uso;
- termo ou conceito usado na documentação → `glossario.md`;
- funcionalidade → `funcionalidades.md`;
- componente/entrypoint/fluxo → `architecture.md` e `estrutura-repositorio.md`;
- rota/contrato → `api.md`;
- schema/migration/índice → `database.md`;
- importador/licença/canonicalização → `catalogo.md`;
- adaptação/substituição → `motor-adaptacao.md`;
- comportamento específico de upload/login em mobile → `mobile-upload-login.md`;
- teste/cobertura → `testes.md`;
- CI/deploy → `deploy.md`;
- decisão estrutural histórica → `CHANGELOG.md`;
- segurança → `SECURITY.md`.

Documentação e implementação devem ser alteradas no mesmo PR quando uma mudança tornar o texto anterior incorreto.
