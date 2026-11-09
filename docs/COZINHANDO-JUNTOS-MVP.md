# Cozinhando Juntos 2.0 — MVP e plano de implementação

## Estado real da base (inspeção de main em 2026-11-08)
- `frontend/src/app/cozinhar-junto/[id]/page.tsx`: convite, presença, progresso, timer local e interface da sala.
- `frontend/src/services/cooking-room-connection.ts`: WebSocket, heartbeat, reconexão, estados `room:state`, `presence:update`, `step:set`.
- `backend/worker-prototype/src/cooking-room.ts`: Durable Object, estado persistente da sala, atualização transacional de etapas, TTL de 24h, limite de 12 conexões.
- O estado atual `completed: boolean[]` é global, sem atribuição a participante. O timer atual é local ao navegador. Ainda não há voz, vídeo, identificação de participantes, reações ou tarefas atribuídas.

## Objetivo e não objetivos
**Objetivo:** permitir que duas pessoas cozinhem em conjunto de maneira significativa, remota ou presencial, com colaboração e conexão emocional.
**Não objetivos do primeiro MVP:** feed social, IA conversacional, gamificação complexa, gravação de chamadas, armazenamento permanente de vídeo, integração direta com MiroFish.

## Fase 0 — Contratos, segurança e compatibilidade (primeiro PR)
- Adicionar `mode: "remote" | "together"` à criação da sala e ao estado, mantendo fallback para salas legadas.
- Criar identidade efêmera por participante (ID aleatório por sala, nome/apelido limitado, avatar), sem confiar em identidade enviada pelo cliente.
- Criar token de convite de alta entropia com capacidade de acesso limitada à sala; impedir adivinhação de IDs e limitar taxa de criação/entrada.
- Protocolo versionado com validação estrita de payload e limites de tamanho/frequência; eventos enviados só a participantes autorizados.
- Preservar `step:set` e consumidores legados durante migração.
- Testes unitários do protocolo e de permissões.

## Fase 1 — Núcleo colaborativo, sem mídia (MVP funcional)
**Ambos:** tela de seleção de modo, convite com link, lista de participantes, estados de conexão, reações rápidas (❤️ 👏 🎉), `help:request`/ `help:resolve`, indicação individual de progresso.
**Remoto:** cada pessoa conclui suas etapas independentemente. Exibir 'eu terminei / aguardando companhia' e avanço consensual; não sobrescrever progresso de outro participante.
**Presencial:** tarefas atribuíveis (eu/você), checklist por responsável, timer compartilhado com deadline do servidor; progresso do prato único.
**Encerramento:** evento `session:finish`, celebração compartilhada e resumo local, sem exigir armazenamento de fotos.
**Aceite:** duas abas ou dispositivos diferentes veem eventos em até ~1s em rede estável; desconectar/reconectar não apaga progresso; mensagens duplicadas não causam dupla conclusão; modo antigo continua funcionando.

## Fase 2 — Voz opcional para o modo remoto
- WebRTC 1:1; Durable Object/WebSocket apenas para sinalização SDP/ICE, não para transportar áudio.
- TURN com credenciais efêmeras e cotas; HTTPS; consentimento explícito para microfone; mute e indicador visível; tratamento de permissões negadas e queda de conexão.
- Se a voz falhar, a sala e o chat/reação continuam utilizáveis.
- Não gravar áudio; não enviar áudio para serviços de IA.
- Aceite: ligação bidirecional em redes distintas, reconexão, sem reprodução automática sem consentimento.

## Fase 3 — Foto do resultado e memória compartilhada
- Cada participante escolhe tirar/enviar foto opcionalmente; revelação simultânea apenas quando ambos consentirem.
- Upload direto com URL assinada para R2, limites de formato/tamanho, remoção e retenção curta; não expor imagens sem autorização.
- Metadados mínimos no Postgres/Neon; exclusão sob solicitação; sem publicação pública por padrão.
- Aceite: conclusão funciona sem fotos; privacidade e exclusão testadas.

## Fase 4 — Vídeo opcional e refinamento
- WebRTC com câmera opcional, priorizando mobile e consumo de bateria; fallback para áudio.
- Painel 'mostre como ficou', câmera pausada por padrão, indicador de câmera ligada.
- Métricas anônimas de conexão e UX, sem registrar conteúdo de áudio/vídeo.

## Modelo de eventos proposto
```ts
type Mode = "remote" | "together";
type ClientEvent =
  | { type: "reaction:send"; emoji: "heart" | "clap" | "celebrate"; eventId: string }
  | { type: "help:request"; eventId: string }
  | { type: "help:resolve"; eventId: string }
  | { type: "progress:set"; stepIndex: number; completed: boolean; eventId: string }
  | { type: "task:assign"; stepIndex: number; participantId: string; eventId: string }
  | { type: "timer:start"; seconds: number; eventId: string }
  | { type: "timer:pause"; eventId: string }
  | { type: "session:finish"; eventId: string };
```
O servidor deve derivar o autor da conexão autenticada, não aceitar `senderId` arbitrário. Validar permissões por modo, versão monotônica, idempotência por `eventId` e deduplicação. Sinalização WebRTC deve ter seu próprio conjunto validado de mensagens.

## Arquitetura
- Next.js/React: seleção de modo, sala e UX acessível.
- Cloudflare Worker + Durable Object por sala: fonte de verdade efêmera, eventos, presença, sincronização, reconexão e sinalização WebRTC.
- WebRTC + TURN: mídia 1:1, sem passar pelo Worker.
- R2: fotos opcionais (fase 3).
- Neon/Postgres: registros persistentes opcionais da sessão (fase 3), nunca cada heartbeat.
- Aplicar retenção e controle de acesso; não publicar nem implantar automaticamente.

## Ordem de entrega sugerida
1. PR A: contratos, identidade/convites, testes.
2. PR B: seleção de modo, reações, ajuda, progresso individual, atribuição e timer compartilhado.
3. PR C: WebRTC áudio 1:1 + TURN, testes em dois dispositivos.
4. PR D: fotos privadas e revelação final.
5. PR E: vídeo opcional.

## Testes obrigatórios
- 2 clientes em dispositivos distintos; modo remoto e presencial.
- Participante sai/volta; refresh; link inválido; sessão expirada; limite de conexões.
- Conclusões concorrentes; reação duplicada; timer após reconexão; queda de WS; falha de TURN.
- Teclado e leitor de tela; rede lenta e mobile; sem permissão de microfone/câmera.
- Sem dados pessoais reais em fixtures. Testes Playwright para interface e integração, testes de Durable Object para eventos e concorrência.

## Métricas de sucesso do piloto
- Pelo menos 90% das duplas convidadas conseguem entrar na sala sem ajuda.
- Pelo menos 80% conseguem completar uma receita em teste guiado.
- Nenhuma perda de progresso em testes de reconexão.
- Falhas de mídia não bloqueiam a receita.
Essas metas são hipóteses de produto, não resultados já medidos.
