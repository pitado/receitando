# Fase 4 — System Design e Infraestrutura | Receitando

**Data:** 29/10/2026. **Escopo:** desenho arquitetural, escalabilidade e integração externa. **Convenção:** **[ATUAL]** implementado e identificado no repositório; **[PROPOSTO]** solução projetada, ainda não implementada; **[A VALIDAR]** hipótese que exige medição.

## 1. Objetivo e requisitos

Arquitetura de backend REST sem estado de processo, frontend web e acesso móvel, capacidade-alvo de **1 milhão de escritas e 2 milhões de leituras**, decisão sobre integração de pagamentos e comunicação em tempo real via WebSocket. O enunciado não informa o período dessas operações; portanto, não se pode garantir capacidade sem definir a janela.

## 2. Arquitetura atual

- **[ATUAL]** Frontend Next.js 16, React 19 e TypeScript, executado via OpenNext/Cloudflare Workers. Interface responsiva/PWA acessível em dispositivos móveis, não aplicativo móvel nativo.
- **[ATUAL]** API REST em Cloudflare Worker independente, roteada por `src/session-cookie-worker.ts` e `src/app-router.ts`, com JSON sobre HTTPS.
- **[ATUAL]** Persistência em Cloudflare D1 (SQLite), imagens em Cloudflare R2, e-mail transacional via Resend.
- **[ATUAL]** Sessões persistidas e transportadas por cookie HttpOnly/Secure/SameSite; a instância Worker não mantém sessão em memória entre chamadas. Controles de Origin e rate limiting complementam segurança.
- **[ATUAL]** GitHub Actions para CI/CD.
- **[EM VALIDAÇÃO]** Receitando Juntos possui implementação inicial de WebSocket/Durable Objects no repositório, mas ainda exige testes de integração, implantação e demonstração entre dispositivos. **[NÃO IMPLEMENTADO]** Cobrança e fila de eventos dedicada. **[A VALIDAR]** Resultado final do cenário de 3 milhões de operações.

```mermaid
flowchart TB
    U[Usuário web ou PWA móvel] --> FE[Next.js / Cloudflare Workers]
    FE -->|REST HTTPS JSON| API[API Worker stateless]
    API --> DB[(Cloudflare D1)]
    API --> IMG[(Cloudflare R2)]
    API --> EMAIL[Resend]
    API -. evolução .-> Q[Cloudflare Queues]
    Q -. eventos .-> DO[Durable Object WebSocket]
    DO -. notificações .-> U
    FE -. publicidade planejada .-> ADS[Google AdSense]
```

Linhas contínuas: arquitetura existente. Linhas pontilhadas: propostas.

### Verificação da infraestrutura Cloudflare (30/10/2026)

**[VERIFICADO NA CONTA CLOUDFARE]** Foram encontrados dois Workers publicados: `receitando` (frontend, com binding de assets e URL da API) e `round-mouse-8bbd` (backend). No backend estão vinculados o D1 `receitando`, o R2 `receitando-recipe-images`, o namespace de Durable Object `CookingRoom` e o segredo da integração Resend. O D1 principal possui **22 tabelas**; há ainda um D1 separado chamado `receitando-benchmark-isolado` para experimentos sem modificar o banco principal. Logs de invocação estão habilitados; traces de execução não estão habilitados.

**[NÃO CONFIGURADO]** A replicação de leitura do D1 principal está **desativada**, e a lista de Cloudflare Queues da conta está vazia. Cache de respostas públicas, filas e réplicas são **etapas de evolução**, não componentes atualmente comprovados. O vínculo com Durable Objects confirma configuração, **não** valida por si só a troca de mensagens WebSocket entre clientes.

**[LIMITAÇÃO]** A existência de Workers e dos bindings na conta não constitui medição de throughput ou de tolerância a picos na Cloudflare. O benchmark k6 aprovado em 30/10 usa `wrangler dev` e **D1 local**.

## 3. Escalabilidade: premissas, matemática e gargalos

| Janela para 1M writes + 2M reads | Escritas/s médias | Leituras/s médias | Total/s médio |
|---|---:|---:|---:|
| 24 horas | 11,57 | 23,15 | 34,72 |
| 1 hora | 277,78 | 555,56 | 833,33 |

**[A VALIDAR]** Considerar picos de 10 vezes a média, testar p95/p99, erros, CPU, limites D1, contenção de escrita, custo e consistência. A multiplicação é um cenário de planejamento, não uma medição.

**Plano de evolução [PROPOSTO]:**
1. Cache na borda **apenas** de respostas públicas que permitam cache; rotas autenticadas e personalizadas permanecem privadas. A política atual de `no-store` exige revisão explícita por endpoint.
2. Índices SQL e paginação; examinar planos de consulta e eliminar consultas desnecessárias.
3. Réplicas de leitura D1, com estratégia de consistência/bookmarks quando aplicável; réplicas **não aumentam** a capacidade de escrita do primário.
4. Fila assíncrona para e-mail, notificações e trabalhos não críticos, com idempotência, retry e dead-letter queue.
5. Se a escrita do D1 for insuficiente, considerar particionamento por domínio/tenant ou outra estratégia de persistência, justificada por medições.
6. Observabilidade: métricas, logs estruturados, traces/correlation-id, alertas, custo e limites.

## 4. Estratégia de testes

**[RESULTADO HISTÓRICO NÃO APROVADO]** A [execução acadêmica inicial](https://github.com/pitado/receitando/actions/runs/40977433968) fez cerca de 2,5 milhões de requisições, porém **100% falharam**. Ela não é evidência de escalabilidade. Após a correção do endpoint de benchmark, os testes posteriores de smoke e mixed foram aprovados, conforme os resultados abaixo.

**[ATUAL — EXECUTADO]** `tests/load/receitando-read.js` testa endpoints públicos GET com k6; a execução inicial de leitura concluiu com 1.060 requisições e zero falhas no ambiente local (não equivale a capacidade de produção). **[CONFIGURADO — NÃO EXECUTADO NESTA VERSÃO]** `tests/load/receitando-professor.js` configura **1.000.000 de escritas e 2.000.000 de leituras indexadas** no D1 local, com identificadores idempotentes e retentativas limitadas. O workflow inclui `professor-check` (1.000 escritas + 2.000 leituras) para validar o procedimento antes da carga completa e `professor` para a meta de 3 milhões. Ao término, `tests/load/verify-professor.mjs` confronta os contadores de sucesso do k6 com a **diferença real de linhas persistidas no D1**, além de erros e p95, publicando `evidence.json` e `report.md`. **O resultado dessa nova execução ainda não existe e não deve ser citado como aprovação**; a execução de 3 milhões anterior falhou.

**[ATUAL — EVIDÊNCIA EM 30/10/2026]** O cenário progressivo `mixed` foi aprovado no [GitHub Actions — execução 40988074830](https://github.com/pitado/receitando/actions/runs/40988074830/job/123843668166). Execução local via `wrangler dev` + D1 local durante **90 s**, com rampa até **10 VUs**. O teste realizou **774 INSERTs bem-sucedidos**, **1.548 SELECTs bem-sucedidos**, total de **2.322 operações HTTP**, exatamente **1 escrita : 2 leituras**, com **0% de erros HTTP**, **2.322/2.322 checks aprovados**, **p95 de 8,62 ms**, máximo de 363,87 ms e média de **25,77 operações/s** ao longo da rampa. O smoke test de escrita e leitura antes do k6 também respondeu `201` e `200`.

**[INTERPRETAÇÃO]** Essa evidência confirma operações concorrentes de leitura e escrita e as metas de erro/latência **nessa carga e nesse ambiente**. A média observada de 25,77 operações/s, medida durante o ramp-up/ramp-down, **não comprova** a média-alvo de 34,72 operações/s para 3 milhões por 24h; tampouco demonstra capacidade em produção. O teste usa tabela sintética `load_benchmark` e SELECT `COUNT(*)`, não representa integralmente o tráfego real do sistema. Prosseguir com patamares sustentados maiores, monitorar p95/p99, falhas e D1, e validar em staging isolado antes de qualquer alegação de escala em produção.

**[A VALIDAR]** Para próximas execuções, exigir erros inferiores a 1% e p95 inferior a 1 s (metas iniciais). Um runner GitHub não representa a capacidade real da Cloudflare.

**[PROPOSTO]** Criar ambiente staging com D1 separado e dados sintéticos. Executar cenários de leitura e escrita na proporção 2:1, ramp-up, pico, endurance e recuperação; exportar JSON e logs, informar duração, VUs, RPS, p95/p99, falhas, custos e limitações. Não executar carga destrutiva em produção.

## 5. Monetização e justificativa para não utilizar API de pagamentos

**[DECISÃO DO PROJETO]** O Receitando será gratuito para os usuários. A monetização planejada será realizada por meio de anúncios com **Google AdSense**; essa integração publicitária ainda não deve ser apresentada como ativa sem validação.

Não serão oferecidos checkout, assinaturas Premium, produtos digitais pagos ou cobrança dentro do aplicativo. Portanto, **não há necessidade funcional de integrar um provedor de pagamentos** ou implementar rotas de cobrança, cartões e webhooks financeiros.

**Distinção importante:** Google AdSense é uma plataforma de publicidade, **não** uma API de processamento de pagamentos para usuários do Receitando. Esta seção registra uma decisão arquitetural fundamentada no modelo de negócios, não uma integração de pagamento implementada. Caso a rubrica acadêmica exija obrigatoriamente um desenho de API de pagamento, a equipe deve confirmar com o professor se essa justificativa atende ao critério.


### Mapeamento de API de pagamento — desenho condicional para a rubrica acadêmica

**[PROPOSTO APENAS PARA FINS ARQUITETURAIS; NÃO IMPLEMENTADO]** Caso o modelo de negócio passe a oferecer um serviço pago, o Receitando poderia integrar um processador como **Mercado Pago ou Stripe** através de uma interface de provedor de pagamentos. Esta **não é uma decisão de lançar um plano Premium**: o produto continuará gratuito e financiado por anúncios. O mapeamento a seguir demonstra a integração exigida no enunciado, sem criar cobrança real:

- **Frontend web/PWA:** solicita à API REST do Receitando a criação de uma intenção de pagamento de um produto hipotético. Nunca manipula credenciais secretas ou grava dados completos do cartão.
- **Backend stateless (Workers):** autentica o usuário, valida valor e produto no servidor, cria um pedido `pending` em D1 e chama a API HTTPS do provedor com chave secreta. Envia uma **chave de idempotência** para evitar cobranças duplicadas em retentativas.
- **Provedor externo:** retorna URL/token de checkout hospedado. Processamento dos dados de cartão fica no provedor.
- **Webhook de pagamento:** provedor chama `POST /api/integrations/payments/webhook`. Worker confere assinatura/autenticidade, registra o ID único do evento para deduplicação, consulta o estado do pagamento junto ao provedor quando necessário e atualiza o pedido de forma idempotente.
- **Consistência e falhas:** pedidos seguem estados `pending`, `paid`, `failed`, `refunded`; eventos fora de ordem não podem desfazer uma confirmação válida. Timeout, retries com backoff e reconciliação periódica mitigam perda de webhook. Segredos no ambiente, HTTPS, auditoria sem dados sensíveis e controle de autorização são obrigatórios.

```mermaid
sequenceDiagram
    participant U as Usuário hipotético
    participant FE as Frontend web/PWA
    participant API as Worker REST
    participant DB as D1
    participant PG as Provedor de pagamento
    U->>FE: Inicia checkout hipotético
    FE->>API: POST /api/payments/checkout
    API->>DB: Cria pedido pending
    API->>PG: Cria preferência/sessão com idempotency key
    PG-->>API: URL/token de checkout
    API-->>FE: URL do checkout
    U->>PG: Finaliza pagamento no provedor
    PG->>API: POST /api/integrations/payments/webhook
    API->>API: Valida assinatura e deduplica evento
    API->>DB: Atualiza pedido para paid/failed
    API-->>PG: HTTP 2xx após processamento seguro
```

**Critério de aceitação:** este diagrama cobre o **mapeamento** da API de pagamentos, conforme o slide, mas **não representa integração ativa, endpoint existente ou cobrança disponível**. AdSense continua sendo monetização por publicidade e não substitui uma API de checkout.

## 6. WebSocket — Receitando Juntos

**[EM VALIDAÇÃO]** A proposta é permitir que pessoas cozinhem a mesma receita em uma sala compartilhada, sincronizando etapas de preparo sem recarregar a página. Uma implementação inicial já foi incorporada ao repositório, mas ainda requer testes e validação de deploy.

```mermaid
sequenceDiagram
    participant A as Pessoa A
    participant API as API Worker
    participant DO as Durable Object da sala
    participant B as Pessoa B
    A->>API: POST /api/v2/cooking-rooms
    API->>DO: Cria sala e estado inicial
    API-->>A: ID e link de convite
    A->>DO: Conecta WebSocket
    B->>DO: Entra pelo link (WebSocket)
    DO-->>B: Estado atual das etapas
    A->>DO: step:set (etapa concluída)
    DO->>DO: Valida e persiste estado
    DO-->>A: room:state atualizado
    DO-->>B: room:state atualizado
```

**Por que WebSocket?** Atualização bidirecional de baixa latência. **Por que Durable Objects?** Coordenação do estado por sala, evitando depender de memória de instâncias REST distintas. Controles necessários: validação de mensagens, convite aleatório, limite de participantes, prevenção de abuso, reconexão e expiração de salas.

**Evidência de código:** [PR #168](https://github.com/pitado/receitando/pull/168). **Limitação:** implementação incorporada não equivale a recurso validado em produção.

## 7. Defesa técnica: decisões e trade-offs

**Por que Workers?** Escala horizontal sem manter instância de servidor própria; atenção a limites, custo e dependências externas. **Por que D1?** Modelo relacional simples e integração com Workers; trade-off: escritas centralizadas exigem validação e eventual mudança de estratégia. **Por que R2?** Separar imagens do banco transacional. **Por que PWA?** Reaproveitar interface web em celular sem criar dois clientes nativos. **Por que REST?** Contrato simples e stateless; WebSocket apenas para eventos em tempo real. **Por que Queue?** Desacoplar tarefas, absorver picos e tolerar falhas temporárias.

**Limitação central:** desenho escalável não é prova de escala. A apresentação deve mostrar resultados reais quando existirem e declarar explicitamente itens propostos.

## 8. Entregáveis e referências do próprio projeto

- Documento principal: este arquivo.
- Arquitetura existente: [architecture.md](architecture.md).
- Banco: [database.md](database.md).
- API: [api.md](api.md).
- Diagrama de componentes: [diagramas/componentes.md](diagramas/componentes.md).
- Teste k6: [receitando-read.js](../tests/load/receitando-read.js).
- Execução e logs: [README do teste](../tests/load/README.md).

**Checklist de apresentação:** explicar arquitetura atual e recursos confirmados na Cloudflare; exibir diagramas, cálculos e gargalos; mostrar resultados reais e limites dos testes k6; justificar a decisão pelo modelo gratuito **e** apresentar o mapeamento condicional de API de pagamentos; apresentar o WebSocket como implementação a validar funcionalmente entre clientes; explicar trade-offs e próximos passos.
