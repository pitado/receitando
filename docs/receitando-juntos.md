# Receitando Juntos

Cada convite identifica um Durable Object independente. A receita original não é
alterada: as etapas e o progresso são uma cópia exclusiva da sala, válida por
24 horas, com até 12 conexões. Quem recebe o convite pode marcar etapas.

## Fluxo

1. Na receita, **Cozinhar junto** envia `POST /api/v2/cooking-rooms`.
2. A interface navega para `/cozinhar-junto/{id}` com o roteador do Next.js.
3. O cliente lê o estado via HTTP (para distinguir sala expirada/acesso bloqueado)
   e abre `GET /api/v2/cooking-rooms/{id}/ws` com upgrade WebSocket.
4. Só após receber `room:state` os checkboxes ficam habilitados. `step:set` grava
   atomicamente o valor desejado e transmite o estado confirmado aos participantes.
5. `presence:update` informa entradas e saídas. A reconexão recupera o snapshot
   atual; alterações offline não são enfileiradas nem sobrescrevem mudanças alheias.

As gravações usam transação para evitar perda de atualizações concorrentes.
Reenviar o mesmo valor não incrementa a versão. O cliente ignora snapshots com
versão inferior à já recebida.

## Recuperação e ciclo de vida

- Sockets usam a API de hibernação do Cloudflare; a lista de conexões vem do runtime.
- Heartbeat da aplicação a cada 20 s, com timeout de 10 s e resposta automática.
- Timeout de abertura de 15 s, seis retentativas com espera exponencial de até 12 s.
- Offline desabilita edições; o evento online retoma a conexão. Existe tentativa manual.
- HTTP 403/404 e fechamento 1008 interrompem a repetição e exibem orientação.
- A expiração é conferida nas leituras e gravações. Um alarme encerra conexões de
  salas novas ao completar 24 h. O estado não é apagado fisicamente por esse alarme.
- CSP permite explicitamente apenas o endpoint WSS da API e WS de desenvolvimento.
- O wrapper de sessão retorna a resposta 101 original, preservando o WebSocket.

## Validação antes do deploy

```bash
cd backend/worker-prototype
npm ci
npm run typecheck
npm test
npm run test:ws
npm run dry-run
```

`test:ws` inicia workerd via Wrangler exclusivamente em loopback, com armazenamento
temporário isolado. Usa dois clientes WebSocket reais para testar criação, CORS,
sincronização nos dois sentidos, atualizações concorrentes, repetição idempotente,
mensagens inválidas, presença, reconexão, recuperação de estado e heartbeat.
Portas locais: 8792 (HTTP/WS) e 8793 (inspetor). Não acessa dados de produção.
O CI da API e seu workflow de deploy executam esse teste antes de publicar.

```bash
cd frontend
npm ci
npm run lint
npm run typecheck
npm run test:coverage
NEXT_PUBLIC_API_URL=https://api.receitando.miguelpita.com.br npm run build:cloudflare
```

Os testes do cliente cobrem reconexão automática, limite de tentativas, estado
confirmado, heartbeat perdido, offline/online, HTTP bloqueado/expirado e desmontagem.
Eles simulam eventos no cliente; não substituem o ensaio de navegador em produção.

## Ensaio manual em produção

Abra dois perfis independentes. Crie uma sala nova por uma receita pública, copie
o convite e abra-o no segundo perfil. Confirme dois participantes. Marque uma
etapa em cada perfil e confira ambos. Feche o segundo, confira presença 1 e altere
outra etapa. Reabra o convite e confira estado recuperado e sincronização retomada.
Para reconexão automática, desconecte somente a rede do segundo perfil e reative-a.
Registre horários, status, estados e erros, sem usar salas de outros usuários.

Um HTTP 403/1010 do Cloudflare é bloqueio do cliente e não comprova defeito no
Worker. Não desative proteções ou altere a identidade do cliente para contorná-lo.
Use os eventos de segurança do proprietário para diagnosticar o bloqueio.

A cópia de imagens do catálogo continua no workflow dedicado `import-wikibooks`;
não faz parte do deploy da API nem dos testes de salas.
