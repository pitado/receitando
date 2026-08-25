# Documentação do Receitando

Esta pasta reúne a documentação funcional e técnica do projeto.

## Visão geral

| Documento | Conteúdo |
| --- | --- |
| [`escopo.md`](escopo.md) | objetivo, problema, público-alvo, funcionalidades, requisitos, entregas e critérios de conclusão |
| [`architecture.md`](architecture.md) | arquitetura atual, componentes, autenticação, matching, persistência e deploy |
| [`api.md`](api.md) | rotas da API, autenticação e exemplos de uso |
| [`database.md`](database.md) | modelo de dados e principais tabelas do Cloudflare D1 |

## Ordem recomendada de leitura

Para entender o projeto do ponto de vista acadêmico e técnico:

1. [`escopo.md`](escopo.md)
2. [`architecture.md`](architecture.md)
3. [`database.md`](database.md)
4. [`api.md`](api.md)

## Organização do repositório

```text
receitando/
├── frontend/                     aplicação web em Next.js
├── backend/worker-prototype/     API atual em Cloudflare Workers
│   ├── migrations/               migrations do Cloudflare D1
│   └── scripts/                  importadores e utilitários
├── backend/                      implementação histórica em NestJS/Prisma
├── docs/                         documentação do projeto
├── .github/workflows/            CI, deploy e automações
└── README.md                     visão geral e instruções de execução
```

A documentação deve acompanhar a implementação. Alterações relevantes de escopo, arquitetura, API ou banco de dados devem ser refletidas no documento correspondente.
