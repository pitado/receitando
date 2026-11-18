# Receitando • Auditoria da Fase 5

**18 de novembro de 2026 · base auditada `ba09a814163904ace0515b51a4f813fb5dcbc527`.** A despensa já implementava as quatro operações. A comprovação principal foi um navegador Chromium operando o frontend Next.js compilado, a API original em workerd e um servidor PostgreSQL 17.11 local. A edição conservou quantidade, unidade e validade após recarregar. A exclusão continuou visível como ausência do item após outra recarga.

| Requisito | Estado | Evidência ou critério aberto |
|---|---|---|
| CRUD da despensa em três camadas | Concluído | [Matriz](matriz.md) e [registro dos testes](evidencias.md). |
| CRUD dos comentários | Parcial | Quatro operações via HTTP com banco real. Interface rastreada no código. Falta repetir o ciclo social no navegador. |
| Mockups | Concluído | [Sete pranchas offline](mockups.html), com seletor de largura mobile. Abrir o HTML baixado no navegador. |
| Código e qualidade | Parcial | 66 testes frontend e 72 backend passaram. Validação de quantidade e concorrência merecem revisão manual. |
| Micro-commits dos materiais | Concluído | Histórico da branch de documentação, por artefato. Os commits da implementação são anteriores à auditoria. |
| Nome de branch com identificador acadêmico | Parcial | Branch válida `docs/fase5-auditoria-crud`. Consulta direta da issue 1332 retornou 404. Falta identificar a tarefa acadêmica real. |
| Revisão humana e merge sem fast-forward | Pendente | Revisar o PR, verificar checks e aprovar o merge commit antes de integrar à main. |
| Demonstração | Parcial | Fluxo local verificado e [roteiro pronto](defesa.md). Apresentação pela equipe pendente. |
| Exigência específica de entidade receita ou de verbo de atualização | Não verificado | A descrição fornecida exige CRUD completo. A equipe deve confirmar se há regra adicional com o professor. |

## O que a equipe precisa decidir

1. **Entidade avaliada.** A despensa gerencia o vínculo entre usuário e ingrediente. Comentários gerenciam outra entidade e têm PATCH explícito. Se a rubrica exigir a própria receita, apresentar criação, edição e exclusão de comentários não satisfaz esse requisito. Verificar essa exigência antes de alterar rotas.
2. **Validação de quantidade.** A tela rejeita negativos. O Worker aceita números finitos negativos e converte valores de tipo incorreto em nulo. O schema permite esses estados. Definir o contrato, validar no servidor e cobrir quantidade negativa, nula e inválida com testes manuais da equipe.
3. **Inclusões concorrentes.** O Worker consulta o par usuário/ingrediente e depois escolhe INSERT ou UPDATE. Duas inclusões simultâneas podem disputar a restrição UNIQUE. A corrida é uma hipótese de revisão estática. Se a equipe alterar a gravação, preservar a semântica de validade omitida e cobrir duas requisições simultâneas.
4. **Critério de avaliação do UPDATE.** Se o professor pedir PUT/PATCH da despensa, a equipe deve implementar manualmente uma rota por item, validar propriedade e atualizar o serviço de edição. Para demonstrar hoje, mostrar o mesmo ID antes e depois de salvar.
5. **Ensaio.** Repetir o roteiro na máquina de apresentação. Manter um banco local descartável com pelo menos uma receita ligada ao ingrediente escolhido.

## Git e escopo

Na coleta inicial havia 173 branches remotas, além do apontador simbólico HEAD. Exemplos ligados à entrega incluem `feat/pantry-quick-add`, `fix/pantry-real`, `feature/pantry-expiry-smart-ranking`, `feat/recipe-social-layer` e `test/playwright-e2e`. A main terminava em uma sequência de commits de SEO. O merge histórico `cfdd744` tem dois pais, `0855b0a` e `eb8aa74`, referentes ao PR #187. Isso documenta o histórico anterior.

A consulta de PRs abertos, antes desta entrega, retornou #185, #184, #183, #167, #165, #163, #161, #145 e #122. A busca de issues por “fase 5” não retornou tarefa. Um número no enunciado pode pertencer ao ambiente da disciplina. Espaços são inválidos em referências Git. Com um identificador confirmado, usar, por exemplo, o formato `docs/<numero>-fase5-crud`, substituindo o marcador pelo número real.

O escopo comparado inclui README, CONTRIBUTING, escopo, funcionalidades, API, banco e design da Fase 4. A tabela de rotas em docs/api.md coincide com as operações rastreadas. A migração 0001 define as entidades, 0002 trata referências externas e 0003 fornece catálogo autoral. Os workflows separam CI frontend, API, E2E, carga, auditoria visual e deploy. A execução local está registrada em evidencias.md. A publicação e os serviços de produção ficaram fora dos testes.

Após revisão humana e autorização de Miguel, selecionar **Create a merge commit** no GitHub. Na CLI, a operação equivalente é `git merge --no-ff docs/fase5-auditoria-crud` sobre a main atualizada. Conferir os dois pais do novo commit. O histórico individual de cada contribuição continua disponível na branch.
