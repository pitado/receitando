# Roteiro de defesa — Fase 4 Receitando

## Apresentação (8–10 minutos)

| Tempo | Slide | Conteúdo |
|---|---|---|
| 0:00–1:00 | Problema e requisitos | Receitas, matching, experiência móvel, REST stateless, metas de carga e integrações |
| 1:00–2:30 | Arquitetura real | Next.js PWA em Worker, API Worker, D1, R2, Resend; fronteiras e responsabilidades |
| 2:30–4:00 | Decisões | REST, Workers, banco relacional, persistência de sessão, segurança e limites |
| 4:00–5:30 | Escalabilidade | 1M writes/2M reads por janela; gargalos, cache público, filas, índices, réplicas de leitura |
| 5:30–6:30 | Testes e evidências | k6, logs, métricas p95, taxa de falha; apresentar somente medições realmente obtidas |
| 6:30–7:30 | Pagamento proposto | Checkout, webhook verificado, idempotência, secrets, sem armazenar cartão |
| 7:30–8:30 | WebSocket proposto | Notificação de aprovação, Durable Objects, reconexão, eventos persistentes |
| 8:30–10:00 | Trade-offs e conclusão | Riscos de escrita D1, custo, observabilidade, limites da prova |

## Perguntas prováveis

**O backend é stateless mesmo com login?** Sim no sentido de não depender de memória de uma instância: a sessão é persistida e validada por requisição. Isso não significa ausência de estado de negócio.

**O D1 aguenta 1 milhão de escritas?** Ainda não foi comprovado. A meta depende do intervalo, concorrência, tipo de transação e limites do primário. Read replication não resolve escrita.

**Por que não colocar tudo em WebSocket?** REST é adequado para CRUD e contratos cacheáveis; WebSocket só para notificações de baixa latência.

**Como garantir que um pagamento não seja confirmado duas vezes?** ID de pedido e evento, atualização idempotente e confirmação server-to-server do provedor.

**O aplicativo é mobile?** É uma interface responsiva/PWA no navegador móvel, não aplicativo nativo.

**O teste k6 prova a capacidade em produção?** Não. O smoke test usa API local no runner do GitHub e é verificação inicial. Uma prova de capacidade exige staging representativo e teste de escrita/leitura com métricas.

## Critérios para concluir

- [x] Documento de arquitetura e proposta de evolução
- [x] Diagramas Mermaid no documento de System Design
- [x] Script de teste de leitura e exportação de logs
- [ ] Execução bem-sucedida e evidências anexadas
- [ ] Teste de escrita em staging com dados sintéticos
- [ ] Validação de metas quantitativas no período definido
- [ ] Slides finalizados
- [ ] Pagamento e WebSocket implementados (somente se o professor exigir implementação, não apenas mapeamento)

Documento principal: [system-design-fase4.md](system-design-fase4.md).
