# Demonstração • cerca de cinco minutos

| Tempo | Ação na tela | Evidência para mostrar |
|---|---|---|
| 0:00–0:40 | Abrir o mockup de despensa. Em seguida abrir o sistema local e autenticar a conta A. | Identificar explicitamente quando começa a aplicação real. No DevTools, filtrar Network por pantry e ocultar headers de sessão. |
| 0:40–1:20 | Adicionar um ingrediente associado a uma receita de teste. | POST retorna a lista com id, ingredientId e quantidade inicial. Anotar o id do item. |
| 1:20–2:10 | Clicar em + quantidade, preencher quantidade, unidade e validade e salvar. | Segundo POST. Comparar id antes e depois. Abrir addPantryItem no ramo UPDATE e mostrar o par usado para localizar o registro. |
| 2:10–3:00 | Recarregar. Abrir a edição novamente. | GET recupera os campos. Conferir o mesmo registro na consulta abaixo e abrir as receitas compatíveis. |
| 3:00–3:45 | Abrir a conta B em outro perfil do navegador. Voltar à conta A e excluir o item. | As listas são individuais. DELETE usa id e user_id. Recarregar e repetir o SELECT para mostrar o desaparecimento da linha. |
| 3:45–5:00 | Abrir uma receita e mostrar a edição de um comentário próprio. | Destacar a rota PATCH como segundo exemplo de UPDATE. Encerrar com resultados dos testes e estado do PR. |

Consulta de leitura para o banco **isolado**. Usar como parâmetro $1 o id retornado pelo primeiro POST. Em um editor SQL sem bind, usar o campo de parâmetro disponível ou substituir por um literal do ambiente de teste.

```sql
SELECT p.id, i.name, p.quantity, p.unit, p.expires_at, p.updated_at
FROM pantry_items AS p
JOIN ingredients AS i ON i.id = p.ingredient_id
WHERE p.id = $1;
```

## Perguntas para a defesa

**Onde está o CREATE?** Em pantry-worker.ts, addPantryItem insere uma linha em pantry_items quando aquele ingrediente ainda não existe para a conta. O ingrediente do catálogo já existe.

**Como provar o UPDATE?** O segundo POST encontra o mesmo par e executa UPDATE. O ID permanece igual, a lista continua com um item e um GET independente recupera os dados novos. A unicidade está no banco.

**Como o frontend chega ao PostgreSQL?** PantryClient chama pantry.service, que usa fetch com cookie. O Worker valida a sessão, o roteador seleciona o módulo e o adaptador executa o SQL parametrizado. A resposta volta em JSON.

**Por que PostgreSQL?** A despensa relaciona usuários e ingredientes. Chaves estrangeiras, unicidade composta e JOIN permitem manter essas relações no banco e devolver nomes junto com as quantidades.

**Como uma conta fica separada da outra?** O servidor identifica a conta pela sessão. As consultas usam esse usuário. Na prova com duas contas, a conta B conseguiu ter o mesmo ingrediente com outro ID e outra quantidade. Excluir o ID de A a partir de B manteve a linha de A.

**Qual é o papel da Cloudflare?** O runtime da API é Workers. A configuração de produção liga o Worker ao Neon por Hyperdrive. R2 atende arquivos e Durable Objects/WebSocket atendem salas em tempo real. A prova local utilizou workerd e PostgreSQL 17.11.

**A equipe testou com mocks?** Há suítes com respostas simuladas e uma suíte específica do adaptador. A evidência de persistência apresentada aqui vem de outra execução com PostgreSQL e de uma sessão de navegador usando o Worker local.

## Se a internet falhar

Deixar o build e as dependências prontos, o Worker local e o PostgreSQL descartável iniciados e uma receita ligada ao ingrediente. Antes de projetar, testar o login em localhost e confirmar uma leitura. Se o ambiente local também falhar, abrir o HTML baixado, a captura identificada como execução anterior e o registro HTTP. Explicar a execução já registrada e marcar a demonstração ao vivo como pendente. Para o review, um colega deve conferir o mesmo ID na edição, a resposta da conta B e o diff restrito à documentação antes de aprovar.
