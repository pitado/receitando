# Documentação — Receitando

A arquitetura de produção utiliza **Next.js/React em Cloudflare Workers**, **API REST stateless**, **Neon PostgreSQL 17 conectado via Cloudflare Hyperdrive**, **Cloudflare R2** para arquivos e **Durable Objects/WebSocket** para salas colaborativas.

## Entrega acadêmica — Fase 4
1. [**Documento obrigatório de System Design**](system-design-fase4.md) — definição de arquitetura, escalabilidade para 1 milhão de escritas e 2 milhões de leituras, limites e integração de pagamentos/WebSocket.
2. [Diagrama de componentes (prévia)](diagramas/componentes.md) · [arquivo editável](../receitando-diagrama-componentes.drawio) — visão da infraestrutura.
3. [DER PostgreSQL (prévia)](diagramas/der.md) · [arquivo editável](../DER.drawio) — modelo de entidades e relações.
4. [Banco e integridade](database.md) — schema real, índices e transações.
5. [Evidências de teste PostgreSQL](../tests/load/README.md) — volume obtido e interpretação correta.
6. [Receitando Juntos](receitando-juntos.md) — WebSocket, presença, versões e reconexão.

**A defesa oral e as justificativas para apresentar ao professor serão preparadas em slides fora do GitHub.** O System Design técnico obrigatório permanece versionado no repositório.

**Diagramas de sequência editáveis:** [matching](../Diagrama-de-Sequencia.drawio) · [envio e moderação](../receitando-diagrama-sequencia-envio-moderacao.drawio) · [índice de diagramas](../DIAGRAMAS-EDITAVEIS.md).

## Engenharia e operação
- [Arquitetura](architecture.md) · [API](api.md) · [Deploy](deploy.md) · [Testes](testes.md)
- [Funcionalidades](funcionalidades.md) · [Escopo](escopo.md) · [Glossário](glossario.md)
- [Estrutura do projeto](estrutura-repositorio.md) · [Catálogo/licenças](catalogo.md)
- [Documentação da API Worker](../backend/worker-prototype/README.md) · [Frontend](../frontend/README.md)
- [Requisitos](../receitando-requisitos.md) · [Casos de uso](../receitando-casos-de-uso.md)

**Fonte de verdade:** código Worker e `backend/worker-prototype/migrations/postgres/` para schema e configuração atuais. Não utilizar exemplos antigos de banco como procedimentos operacionais.
