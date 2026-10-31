# Documentação — Receitando

A arquitetura de produção utiliza **Next.js/React em Cloudflare Workers**, **API REST stateless**, **Neon PostgreSQL 17 conectado via Cloudflare Hyperdrive**, **Cloudflare R2** para arquivos e **Durable Objects/WebSocket** para salas colaborativas.

## Diagramas UML — clicar para visualizar

Os arquivos `.puml` são fontes PlantUML e o GitHub os apresenta como texto. Para visualizar o **desenho**, use estas páginas renderizadas:

**[DER PostgreSQL](../DER.md)** · **[Componentes](../Diagrama-de-Componentes.md)** · **[Matching](../Diagrama-de-Sequencia.md)** · **[Envio e moderação](../Diagrama-de-Moderacao.md)** · **[Classes do frontend](../Diagrama-de-Classes.md)**.

[Todos os diagramas e arquivos UML](../DIAGRAMAS-EDITAVEIS.md).

## Entrega acadêmica — Fase 4
1. [**Documento obrigatório de System Design (visual)**](system-design-fase4.md) — diagramas de contexto, containers, fluxos REST, ER, escalabilidade 1M/2M e integrações, com justificativas e limites.
2. [Diagrama de componentes (prévia)](diagramas/componentes.md) · [fonte UML](../receitando-diagrama-componentes.puml) — visão da infraestrutura.
3. [DER PostgreSQL (prévia)](diagramas/der.md) · [fonte UML](../DER.puml) — modelo de entidades e relações.
4. [Banco e integridade](database.md) — schema real, índices e transações.
5. [Evidências de teste PostgreSQL](../tests/load/README.md) — volume obtido e interpretação correta.
6. [Receitando Juntos](receitando-juntos.md) — WebSocket, presença, versões e reconexão.

**O documento principal é a fonte técnica para a defesa pública.** Os diagramas exibem a arquitetura implementada e identificam propostas hipotéticas; material de apresentação, quando utilizado, é apenas apoio.

**Diagramas de sequência editáveis:** [matching](../receitando-diagrama-sequencia-matching.puml) · [envio e moderação](../receitando-diagrama-sequencia-envio-moderacao.puml) · [índice de diagramas](../DIAGRAMAS-EDITAVEIS.md).

## Engenharia e operação
- [Arquitetura](architecture.md) · [API](api.md) · [Deploy](deploy.md) · [Testes](testes.md)
- [Funcionalidades](funcionalidades.md) · [Escopo](escopo.md) · [Glossário](glossario.md)
- [Estrutura do projeto](estrutura-repositorio.md) · [Catálogo/licenças](catalogo.md)
- [Documentação da API Worker](../backend/worker-prototype/README.md) · [Frontend](../frontend/README.md)
- [Requisitos](../receitando-requisitos.md) · [Casos de uso](../receitando-casos-de-uso.md)

**Fonte de verdade:** código Worker e `backend/worker-prototype/migrations/postgres/` para schema e configuração atuais. Não utilizar exemplos antigos de banco como procedimentos operacionais.
