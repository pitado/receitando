# Funcionalidades do Receitando

Este documento registra o que existe atualmente no sistema do ponto de vista do usuário e relaciona cada área à implementação de produção.

## 1. Catálogo de receitas

O usuário pode navegar pelo catálogo e abrir detalhes de cada receita.

Cada receita pode apresentar título, descrição, ingredientes/quantidades, modo de preparo, categoria, dificuldade, imagem, tags e informações de procedência/licença.

A página `/receitas` usa o endpoint **`GET /api/v2/recipes`**, com paginação, filtros e ordenação. O catálogo público reúne o acervo validado do Wikilivros e receitas da comunidade que já foram aprovadas e publicadas.

## 2. Busca textual e filtros

A listagem de receitas permite pesquisa textual por `q`.

A API utiliza SQLite **FTS5** sobre título e descrição, com busca por termos/prefixos e ordenação por relevância. A busca principal não depende de `LIKE '%termo%'` em toda a tabela de receitas.

O catálogo v2 também permite filtrar por:

- fonte (`source`);
- tipo de refeição (`mealType`);
- dificuldade (`difficulty`);
- tempo máximo (`maxPrepMinutes`).

Ordenações aceitas: `relevance`, `recent`, `popular`, `quick` e `title`.

## 3. Matching por ingredientes

O usuário informa de 1 a 40 ingredientes. A API:

1. normaliza o texto;
2. gera a forma completa e uma forma canônica conservadora;
3. resolve nomes e aliases exatos para `ingredient_id`;
4. busca receitas candidatas;
5. ignora opcionais e ingredientes básicos no denominador;
6. calcula compatibilidade.

Variações comuns podem apontar para o mesmo ingrediente:

```text
cebola / cebolas / cebolas picadas → cebola
```

A regra evita inferência por substring. Portanto, compostos semanticamente distintos continuam separados, como `óleo` e `óleo de gergelim torrado`.

O resultado informa:

- percentual de compatibilidade;
- status (`READY`, `ALMOST_READY`, `NEAR` ou `EXPLORE`);
- ingredientes obrigatórios encontrados;
- ingredientes faltantes;
- ingredientes opcionais;
- ingredientes básicos (`stapleIngredients`);
- acesso ao detalhe da receita.

### 3.1 Ingredientes básicos

Ingredientes marcados `is_staple = true` — como água, sal, pimenta e óleo genérico na política atual — continuam fazendo parte da receita, mas não reduzem a compatibilidade nem entram na lista principal de faltantes.

### 3.2 Quantidades

O matching principal é booleano (`tem` / `não tem`). Quantidade e unidade são armazenadas e exibidas, porém ainda não alteram a porcentagem de compatibilidade.

O motor de adaptação possui uma regra separada e consegue comparar algumas quantidades/unidades compatíveis para avisar quando a despensa parece insuficiente. Isso não muda o cálculo percentual do combinador.

## 4. Despensa

Usuários autenticados possuem uma despensa persistente no D1.

É possível listar, adicionar, atualizar quantidade/unidade/validade, remover itens e usar a despensa diretamente no matching. Toda operação é vinculada ao `user_id` autenticado.

### 4.1 Validade

Cada item da despensa pode receber uma data de validade opcional.

A interface:

- permite informar a validade ao adicionar um ingrediente;
- permite alterar ou remover a validade depois;
- mostra mensagens relativas como `Vence hoje`, `Vence amanhã` e `Vence em N dias`;
- destaca itens vencidos ou com vencimento próximo;
- exibe um alerta da despensa quando existem itens vencidos ou com até 3 dias para vencer;
- mantém itens com validade ordenados pela data mais próxima antes dos itens sem validade.

O campo `expires_at` já existia no schema da despensa. Esta evolução passou a utilizá-lo na experiência do produto sem exigir uma migration nova.

O aviso atual é **in-app**. Web Push, e-mail automático ou outra notificação externa em segundo plano ainda não fazem parte desta implementação.

### 4.2 Matching da despensa com prioridade de consumo

A porcentagem de compatibilidade continua sendo calculada pela API com a mesma regra de presença/ausência. A validade **não altera o percentual**.

Quando o usuário escolhe **Usar minha despensa**, o frontend consulta em paralelo:

- `GET /api/recipes/match/pantry` para obter as receitas compatíveis;
- `GET /api/pantry` para obter os itens e suas validades.

Depois, a interface aplica um critério adicional de ordenação para resultados próximos.

Regra atual:

1. se a diferença de compatibilidade entre duas receitas for superior a 5 pontos, prevalece a maior compatibilidade;
2. se a diferença for de até 5 pontos, a receita que usa ingredientes mais urgentes pode subir na ordenação;
3. persistindo o empate, são usados compatibilidade, menor quantidade de faltantes, menor tempo de preparo e título.

Peso de urgência por ingrediente encontrado:

| Validade | Peso |
| --- | ---: |
| vencido ou vence hoje | 5 |
| vence amanhã | 4 |
| vence em 2–3 dias | 3 |
| vence em 4–7 dias | 1 |
| mais de 7 dias ou sem validade | 0 |

O score de urgência de uma receita é a soma dos pesos dos ingredientes encontrados nela.

Esse mecanismo preserva a proposta principal do matching e usa a validade apenas como critério de aproveitamento quando as opções já são semelhantes em compatibilidade.

### 4.3 Lista de compras automática

No detalhe de uma receita, usuários autenticados podem comparar a receita com a própria despensa.

A interface gera uma lista contendo apenas ingredientes obrigatórios que não foram encontrados na despensa.

Não entram na lista principal:

- ingredientes já presentes;
- ingredientes opcionais;
- ingredientes básicos (`is_staple`).

A lista pode ser copiada para uso fora da aplicação.

Como esse fluxo usa presença/ausência, ele ainda não calcula uma compra parcial do tipo “tenho 200 g e preciso comprar mais 300 g”. Essa comparação quantitativa parcial permanece restrita às verificações compatíveis do motor de adaptação.

### 4.4 Adaptação e substituição de ingredientes

O detalhe da receita possui um **motor culinário experimental**.

O usuário pode:

- alterar o rendimento desejado;
- marcar ingredientes indisponíveis;
- usar a despensa automaticamente quando autenticado;
- receber quantidades recalculadas quando o rendimento original permite;
- visualizar faltas e possíveis insuficiências de quantidade em unidades comparáveis;
- receber substituições conhecidas quando elas forem compatíveis com o contexto culinário identificado.

O motor apresenta nível de confiança, justificativa e alternativas quando disponíveis.

Também são inferidos sinais do contexto da receita, como preparo assado, frito, cozido, fresco, doce/salgado e casos em que determinado ingrediente possui papel estrutural.

Se não houver substituição suficientemente confiável para aquele contexto, a interface informa essa limitação em vez de inventar uma equivalência.

## 5. Autenticação e sessão

O sistema possui cadastro, login, logout, consulta da sessão atual e sessão persistente.

Senhas são derivadas com PBKDF2 e o D1 guarda somente o hash do token de sessão.

## 6. Rate limiting

O entrypoint da API reduz abuso em:

- login por e-mail;
- login por IP;
- cadastro por IP;
- solicitação de recuperação por e-mail;
- solicitação de recuperação por IP.

Os identificadores dos buckets são persistidos apenas como SHA-256. Limites atingidos retornam `429` com `Retry-After`.

## 7. Perfil

Usuários autenticados podem consultar e editar nome, identificador `@` único e avatar predefinido. Handles reservados e duplicados são rejeitados.

## 8. Recuperação de senha

O fluxo utiliza código de seis dígitos enviado via Resend.

Proteções implementadas:

- resposta genérica para não enumerar contas;
- rate limiting antes do fluxo de envio;
- cooldown de reenvio;
- validade limitada;
- limite de tentativas;
- código armazenado de forma derivada;
- token temporário armazenado apenas como hash;
- invalidação de sessões depois da troca de senha.

## 9. Favoritos, avaliações e comentários

Usuários autenticados podem salvar/remover favoritos e registrar/remover `LIKE` ou `DISLIKE`.

Comentários podem ser listados publicamente. Criação exige autenticação e edição/exclusão validam o dono do registro.

## 10. Receitas da comunidade

A navegação principal inclui **Enviar receita**, que leva a `/enviar-receita`.

O envio pode ser feito com ou sem conta. Quando há sessão válida, a API associa `user_id`; quando não há, a submissão permanece anônima no vínculo de conta.

O formulário atual exige:

- nome do autor;
- título;
- descrição;
- pelo menos 2 ingredientes;
- pelo menos 1 passo de preparo;
- foto do prato.

O e-mail do autor, tempo, porções e tipo de refeição são opcionais.

Limites do envio:

- até 50 ingredientes;
- até 30 passos;
- foto de até 12 MB;
- tipos reais aceitos: JPG, PNG e WebP.

A foto é enviada em `multipart/form-data`. A API valida a assinatura do arquivo e armazena o objeto no Cloudflare R2 (`RECIPE_IMAGES`). Se a persistência no D1 falhar depois do upload, o objeto criado é removido.

Toda submissão válida nasce com `status = 'PENDING'` e não entra automaticamente no catálogo.

## 11. Moderação administrativa

O painel `/admin/receitas` é restrito a usuários com `role = 'ADMIN'`.

O administrador pode filtrar a fila por `PENDING`, `APPROVED`, `REJECTED` ou `ALL`, revisar conteúdo e decidir entre aprovação ou rejeição.

A moderação registra:

- `reviewed_by`;
- `reviewed_at`;
- `rejection_reason` quando informado;
- `published_recipe_id` quando a submissão é aprovada.

Uma submissão já analisada não pode ser analisada novamente.

Na aprovação, a API cria a receita com `source_type = 'USER'`, adiciona os ingredientes canônicos/relações necessárias e publica o item no catálogo v2.

## 12. Feed da home

`GET /api/home-feed` consolida receitas populares, comentários recentes e totais usados pela página inicial.

## 13. Estados de interface

O frontend possui tratamento de carregamento, erro, conteúdo vazio, página 404 e feedback de ações autenticadas.

A tela `/combinar` explica a regra de compatibilidade e, no modo despensa, informa que a validade é usada apenas para priorizar resultados próximos.

As telas de envio e moderação também possuem estados de envio, sucesso, erro, acesso negado e conteúdo vazio.

## 14. Importação e canonicalização

A operação de catálogo é separada da navegação do usuário.

O fluxo atual:

1. consulta o Wikilivros;
2. descobre páginas candidatas;
3. interpreta ingredientes/preparo como texto;
4. procura imagem no Wikimedia Commons;
5. valida relevância/licença;
6. registra procedência;
7. grava receitas em lotes;
8. canonicaliza variações de ingredientes;
9. preserva aliases;
10. marca staples e otimiza o banco;
11. espelha imagens operacionais para o R2.

Scripts ativos:

```text
backend/worker-prototype/scripts/import-wikibooks-v2.mjs
backend/worker-prototype/scripts/canonicalize-ingredients.mjs
backend/worker-prototype/scripts/mirror-wikibooks-images-to-r2.mjs
```

## 15. Tratamento de conteúdo externo

O conteúdo culinário aproveitado do Wikilivros é convertido para texto pelo importador. A tela de receita renderiza strings React e não HTML bruto da fonte externa.

Metadados da receita e da imagem são preservados separadamente para atribuição.

## 16. API e persistência

A API é organizada em autenticação/perfil, recuperação, catálogo v2, fontes, ingredientes, receitas/matching, adaptação, submissões/moderação, despensa, favoritos, votos, comentários e home.

A produção usa Cloudflare D1 para usuários, sessões, catálogo canônico, aliases, FTS5, despensa, favoritos, recuperação, comunidade, procedência, submissões/moderação e rate limiting.

Cloudflare R2 armazena as imagens enviadas pela comunidade e imagens operacionais espelhadas do catálogo. As fotos de submissões são servidas pela API em `/api/recipe-submission-images/:key`.

Detalhes:

- [`api.md`](api.md)
- [`database.md`](database.md)
- [`architecture.md`](architecture.md)

## 17. Qualidade

O frontend possui testes com Vitest/Testing Library e fluxo E2E com Playwright.

A API possui testes de regras puras e testes de rota com D1 simulado, incluindo canonicalização, staples, FTS5, autenticação, autorização, rate limiting, catálogo v2, matching, adaptação de receitas, recuperação, interação social e submissão/moderação de receitas.

CI também executa lint/typecheck/build/dry-run conforme o componente.

## 18. Relação com o escopo

Este documento descreve **o que existe na implementação**. [`escopo.md`](escopo.md) define objetivos, requisitos e critérios acadêmicos usados como referência para o projeto.
