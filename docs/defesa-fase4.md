# Defesa técnica — Fase 4 | Receitando

**Objetivo:** demonstrar e defender a arquitetura do Receitando, o planejamento de escalabilidade e o mapeamento das integrações. **Não confundir proposta, implementação e teste validado.**

## 1. Roteiro para apresentação (8–10 minutos)

| Tempo | Tema | O que demonstrar e defender |
| --- | --- | --- |
| 0:00–1:00 | Problema e solução | Desperdício e dificuldade de escolher receitas; busca por ingredientes, despensa e catálogo |
| 1:00–2:30 | Arquitetura atual | Next.js/React/TypeScript, frontend PWA responsivo, API REST Cloudflare Workers, D1, R2 e Resend |
| 2:30–3:30 | Decisões técnicas | REST sem estado em memória, sessões persistidas, HTTPS, separação de camadas e limites de D1 |
| 3:30–5:00 | Escalabilidade | Meta de 1 milhão de escritas e 2 milhões de leituras; definir período, calcular taxa/s, prever picos, cache, índices, filas e gargalos |
| 5:00–6:15 | Evidência de testes | Mostrar GitHub Actions/k6 e métricas reais: operações bem-sucedidas, falhas, duração, throughput e p95; distinguir local de produção |
| 6:15–7:30 | WebSocket — Receitando Juntos | Criar sala, compartilhar link, sincronizar etapas de preparo, reconectar; Durable Objects por sala |
| 7:30–8:15 | Integração externa e monetização | Produto gratuito e AdSense planejado; apresentar desenho condicional de integração com API de pagamento, sem alegar implementação |
| 8:15–10:00 | Trade-offs e conclusão | Custos, segurança, observabilidade, consistência, próximos passos e limites do que foi comprovado |

## 2. Texto-base para apresentação

**Abertura:** “O Receitando ajuda a decidir o que cozinhar com os ingredientes disponíveis, reduzindo desperdício e simplificando o planejamento. O foco desta fase é demonstrar como a arquitetura atual funciona e como ela pode evoluir para suportar escala e comunicação em tempo real.”

**Arquitetura:** “O frontend utiliza Next.js e React, acessível no computador e no celular como aplicação web responsiva/PWA. A API REST roda em Cloudflare Workers, com dados no D1 e imagens no R2. A lógica de negócio não depende de manter uma sessão na memória de uma instância do Worker; as sessões são persistidas e verificadas por requisição.”

**Escalabilidade:** “A meta acadêmica é um milhão de escritas e dois milhões de leituras. Sem especificar em quanto tempo, não há taxa mínima de operações por segundo definida. Se a janela for de 24 horas, a média exigida é de 11,57 escritas/s e 23,15 leituras/s. Se for de uma hora, sobe para 277,78 e 555,56 operações/s. Também precisamos considerar picos e o limite de escrita do D1.”

**Teste:** “No [teste misto de 30/10/2026](https://github.com/pitado/receitando/actions/runs/40988074830), realizamos 774 escritas e 1.548 leituras, total de 2.322 requisições, com zero falhas e p95 de 8,62 ms. Foi um ensaio local no GitHub Actions de 90 segundos, chegando a 10 usuários virtuais. O teste acadêmico anterior de milhões de operações falhou e não pode servir de prova de escala. Precisamos testar carga sustentada e infraestrutura de staging antes de garantir os 3 milhões em produção.”

**WebSocket:** “Propomos o Receitando Juntos: duas pessoas entram na mesma sala por um link e acompanham o preparo sincronizado. O WebSocket transmite alterações de etapas instantaneamente; um Durable Object coordena o estado da sala. A integração foi iniciada em código, mas só deve ser apresentada como funcional após testes e implantação validados.”

**Monetização e API de pagamento:** “O Receitando é gratuito, com Google AdSense planejado. Por isso não existe checkout real. Entretanto, mapeamos tecnicamente uma integração hipotética com um provedor de pagamentos: Worker cria pedido, solicita checkout com idempotência e processa webhook assinado, atualizando o D1. Isso atende ao mapeamento arquitetural sem afirmar que cobramos ou que a integração esteja implementada.”

**Conclusão:** “A arquitetura existente atende às funcionalidades atuais. A fase apresenta uma estratégia de evolução baseada em evidências, com limites explícitos: uma configuração de teste não é resultado comprovado, e a escala de um ambiente local não equivale à escala de produção.”

## 3. Perguntas que o professor pode fazer

**Por que a API é stateless se existe login?** Porque o Worker não depende de uma sessão guardada em sua memória. A sessão fica persistida e é consultada/validada por requisição. Os dados do negócio continuam tendo estado no banco.

**Por que Cloudflare Workers?** Execução distribuída e integração com os serviços usados. É necessário considerar limites, custo e dependências; “serverless” não significa capacidade infinita.

**Por que D1?** Banco relacional integrado à plataforma, adequado ao estágio do produto. O gargalo potencial é a concorrência de escritas. Réplicas de leitura não ampliam a capacidade de escrita do primário.

**O que significa 1 milhão de escritas e 2 milhões de leituras?** É uma quantidade de operações. Precisamos da janela temporal e da carga real para transformá-la em uma meta verificável de throughput.

**O teste do GitHub prova que a Cloudflare suporta isso?** Não. O teste usa um runner, API local e D1 local, com operações sintéticas. É uma evidência de comportamento do cenário, não uma certificação de produção.

**Por que WebSocket e não só REST?** REST serve bem a consultas e operações pontuais. WebSocket permite enviar atualizações de etapas em tempo real, sem polling contínuo.

**Por que Durable Objects?** Para concentrar a coordenação e o estado de cada sala em uma unidade consistente. Cada sala pode ser independente; ainda são necessários limites, reconexão, persistência e segurança.

**WebSocket já está pronto?** Existe uma implementação inicial em desenvolvimento, mas a demonstração real depende de validação de CI, testes entre dispositivos e implantação. Se não estiver validado, apresentar como protótipo/proposta.

**Como vocês mapearam a API de pagamento se o aplicativo é gratuito?** Por exigência do System Design, documentamos uma integração **condicional e hipotética** com um provedor: criação de pedido/checkout, token ou URL do provedor, webhook verificado, idempotência, estados de pagamento e tratamento de falhas. O produto atual não cobra. Google AdSense é publicidade, não pagamento de checkout. O desenho está no documento principal.

**Quais riscos existem?** Escritas concorrentes no D1, custos de infraestrutura, reconexão de sockets, abuso na criação de salas, falhas externas e inconsistência de estado. A defesa deve mostrar como medir e mitigar cada risco.

## 4. Evidências para abrir durante a apresentação

- [System Design e diagramas](system-design-fase4.md)
- [Arquitetura existente](architecture.md)
- [Testes de carga e limitações](../tests/load/README.md)
- [Workflow k6](../.github/workflows/load-test.yml)
- [Execução mista APROVADA — 774 escritas, 1.548 leituras](https://github.com/pitado/receitando/actions/runs/40988074830)
- [Execução acadêmica anterior — FALHOU, não apresentar como prova de escala](https://github.com/pitado/receitando/actions/runs/40977433968)
- [Receitando Juntos — implementação inicial (PR #168)](https://github.com/pitado/receitando/pull/168)

## 5. Checklist antes da defesa

- [x] Arquitetura atual e decisões técnicas documentadas.
- [x] Diagrama de componentes e planejamento de escala documentados.
- [x] Scripts e workflow k6 criados.
- [x] Proposta WebSocket Receitando Juntos definida e desenvolvimento iniciado.
- [x] Registrar resultado do teste misto aprovado (774 escritas + 1.548 leituras; 0 falhas; p95 de 8,62 ms).
- [ ] Comprovar meta de 1 milhão de escritas e 2 milhões de leituras em janela definida e ambiente apropriado (ainda não comprovada).
- [ ] Validar integração WebSocket com testes reais, caso seja demonstrada funcionando.
- [x] Registrar decisão de negócio: sem cobrança no aplicativo; monetização planejada via Google AdSense.
- [x] Mapear tecnicamente API de pagamentos hipotética (checkout, assinatura de webhook, idempotência e segurança), sem cobrança real.
- [ ] Preparar slides e ensaiar a apresentação com tempo cronometrado.

**Infraestrutura verificada na Cloudflare em 30/10/2026:** há Workers publicados para frontend e backend; backend tem bindings D1, R2, Durable Objects e Resend; logs habilitados. Réplicas de leitura D1 desativadas e Queues não configuradas. Isso é inventário de infraestrutura, não benchmark de produção.

**Regra de defesa:** não afirmar que o sistema atingiu 3 milhões de operações ou que o WebSocket está funcional em produção sem evidência verificável.
