# Defesa da arquitetura — Receitando

Este roteiro reúne os pontos que precisamos explicar na apresentação. A ideia não é decorar um texto, e sim entender por que escolhemos cada tecnologia e como vamos lidar com os limites do sistema.

## Ordem sugerida da apresentação

| Parte | O que mostrar |
| --- | --- |
| O problema | O Receitando ajuda a encontrar receitas com o que a pessoa já tem em casa. |
| Como a aplicação funciona | Interface Next.js/React, API REST em Cloudflare Workers, D1 para dados e R2 para imagens. |
| O que significa backend stateless | A API não depende da memória de uma instância para manter login ou dados de negócio. |
| Escalabilidade | Como atender 1 milhão de escritas e 2 milhões de leituras; o papel do cache, das consultas SQL e dos limites do banco. |
| Testes realizados | Resultado do k6 e diferença entre um teste local e a infraestrutura remota da Cloudflare. |
| Integrações | WebSocket no Receitando Juntos; desenho de pagamento como alternativa futura, já que o aplicativo é gratuito. |
| Fechamento | Limites atuais, pontos que precisam de medição e possíveis melhorias. |

## Pontos principais para explicar

### Estrutura do sistema

O frontend é uma aplicação web feita com Next.js e React. Ela funciona no computador e no celular pelo navegador. A API roda separadamente em um Cloudflare Worker e é responsável pela autenticação, pelo catálogo, pelos favoritos e pelas demais regras do sistema.

O D1 guarda os dados relacionais. O R2 fica com as imagens, para não carregar o banco com arquivos. A aplicação usa HTTPS e sessões persistidas; o Worker não precisa manter uma sessão em memória para responder à próxima requisição.

O [diagrama de componentes](diagramas/componentes.md) ajuda a mostrar essas relações.

### Estratégia para o volume solicitado

O volume de referência é **1 milhão de escritas e 2 milhões de leituras**. Como não foi definido um período, podemos explicar dois cenários:

- Em 24 horas, são aproximadamente **11,57 escritas e 23,15 leituras por segundo**.
- Em 1 hora, a necessidade sobe para **277,78 escritas e 555,56 leituras por segundo**.

Workers ajudam a ampliar a camada de aplicação, mas o D1 continua sendo um ponto de atenção porque cada banco processa consultas sequencialmente. Para reduzir a pressão sobre ele, o plano é revisar índices, aproveitar cache nas respostas públicas, manter paginação e desacoplar tarefas que não precisam ser feitas imediatamente. Se as escritas passarem do limite observado, será necessário rever a distribuição dos dados.

**O ponto mais importante para defender:** não basta dizer que a Cloudflare escala. Precisamos explicar o que acontece com o banco e como vamos medir os gargalos.

### Testes

O teste misto realizado no GitHub Actions em **30/10/2026** teve **774 escritas e 1.548 leituras** concluídas, sem falhas HTTP e com **8,62 ms de latência p95**. Foram 90 segundos de execução, chegando a 10 usuários virtuais.

[Ver execução do teste misto](https://github.com/pitado/receitando/actions/runs/40988074830/job/123843668166)

Esses números mostram que a combinação de leitura e escrita funcionou **no ambiente local do Wrangler**. Não significam que já comprovamos 3 milhões de operações em produção. O cenário completo está preparado no Actions, com relatório e conferência das linhas gravadas, mas precisa de execução e análise para ser usado como evidência.

### WebSocket

O **Receitando Juntos** usa WebSocket para que duas pessoas possam acompanhar a mesma receita. Uma sala é criada pela API e cada sala fica associada a um Durable Object. Quando alguém marca uma etapa, o objeto salva a alteração e informa os participantes conectados.

O mapeamento já mostra os endpoints, a conexão, as mensagens `step:set`, `room:state` e `presence:update`, além dos limites da sala. Há código e binding na Cloudflare; a demonstração entre dispositivos continua pendente de validação.

[Ver mapeamento completo do WebSocket](websocket-receitando-juntos.md)

### Pagamentos

O Receitando é gratuito. A monetização considerada é por anúncios, com AdSense, e por isso **não implementamos cobrança**. Como o trabalho também pede mapeamento de API de pagamento, desenhamos como seria uma integração futura: o Worker cria o pedido, conversa com o provedor e recebe um webhook para atualizar o estado do pagamento. Isso está documentado, mas não é uma função disponível no aplicativo.

## Perguntas que podem aparecer

**Se o sistema tem login, por que dizemos que a API é stateless?**  
Porque o login não depende de uma variável em memória no Worker. A sessão é validada a cada requisição com base nos dados persistidos.

**O D1 aguenta 1 milhão de escritas?**  
Não dá para garantir sem saber em quanto tempo elas chegam e sem medir o banco remoto. O documento mostra o dimensionamento e a estratégia para reduzir leituras e tratar os limites de escrita.

**Por que não guardar tudo no D1?**  
Porque imagens são arquivos grandes e ficam melhor no R2. O banco mantém as informações estruturadas e as referências necessárias.

**Qual é a diferença entre REST e WebSocket no projeto?**  
REST resolve operações pontuais, como buscar ou criar uma receita. WebSocket mantém a conexão aberta para enviar mudanças da sala assim que elas acontecem.

**O WebSocket já funciona?**  
O backend e o Durable Object estão implementados e configurados. O teste completo de sincronização entre dispositivos ainda precisa ser apresentado como validação pendente.

**Por que mapear pagamentos se o aplicativo é gratuito?**  
Porque é um exercício de projeto de integração. O desenho demonstra como o sistema receberia confirmações de um provedor sem expor credenciais nem processar cobranças duplicadas.

## Links para abrir na apresentação

- [System Design](system-design.md)
- [Arquitetura](architecture.md)
- [Diagrama de componentes](diagramas/componentes.md)
- [Mapeamento do WebSocket](websocket-receitando-juntos.md)
- [Testes de carga](../tests/load/README.md)

O ideal é apresentar o que já existe, explicar com clareza o que ainda está planejado e não transformar testes locais em promessas sobre produção.
