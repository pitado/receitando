# API do Receitando

A API de produção roda em **Cloudflare Workers**, usa **Cloudflare D1** e responde em JSON.

Base de produção:

```text
https://api.receitando.miguelpita.com.br
```

Base local:

```text
http://localhost:8787
```

## Convenções

- rotas da aplicação usam `/api`;
- corpos usam JSON;
- erros seguem, em geral, `{ "statusCode": number, "message": string }`;
- no navegador, rotas autenticadas usam cookie de sessão `HttpOnly` enviado com `credentials: "include"`;
- o token bruto de sessão não faz parte do contrato público de login/cadastro;
- CORS com credenciais aceita apenas origens declaradas em `FRONTEND_URL`;
- operações mutáveis do navegador validam `Origin` como defesa adicional contra CSRF;
- respostas sensíveis usam `Cache-Control: no-store`;
- login, cadastro e solicitação de recuperação de senha passam por rate limiting no entrypoint.

Clientes não-browser podem usar `Authorization: Bearer <token>` quando possuírem uma credencial válida, mas o frontend oficial não lê nem persiste esse token em JavaScript.

## Mapa de rotas

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/` | público | identificação da API |
| `GET` | `/api/health` | público | healthcheck |
| `POST` | `/api/auth/register` | público | criar conta e sessão |
| `POST` | `/api/auth/login` | público | autenticar |
| `GET` | `/api/auth/me` | autenticado | consultar perfil |
| `PATCH` | `/api/auth/me` | autenticado | alterar nome, `@` e avatar |
| `POST` | `/api/auth/logout` | autenticado | encerrar sessão atual |
| `POST` | `/api/auth/forgot-password` | público | solicitar recuperação |
| `POST` | `/api/auth/verify-reset-code` | público | validar código |
| `POST` | `/api/auth/reset-password` | público | definir nova senha |
| `GET` | `/api/sources` | público | listar fontes do catálogo |
| `GET` | `/api/ingredients` | público | listar ingredientes do catálogo |
| `GET` | `/api/recipes` | público | listar/buscar receitas |
| `GET` | `/api/recipes/:slug` | público | detalhe por slug |
| `POST` | `/api/recipes/match` | público | matching por ingredientes |
| `GET` | `/api/recipes/match/pantry` | autenticado | matching usando a despensa |
| `POST` | `/api/recipes/:slug/adapt` | público/autenticado quando `usePantry=true` | adaptar rendimento, faltas e substituições |
| `GET` | `/api/pantry` | autenticado | listar despensa |
| `POST` | `/api/pantry` | autenticado | adicionar/atualizar item |
| `DELETE` | `/api/pantry/:itemId` | autenticado | remover item próprio |
| `GET` | `/api/favorites` | autenticado | listar favoritos |
| `POST` | `/api/favorites` | autenticado | favoritar receita |
| `DELETE` | `/api/favorites/:recipeId` | autenticado | remover favorito |
| `GET` | `/api/recipes/:recipeId/social` | público | resumo de votos |
| `PUT` | `/api/recipes/:recipeId/vote` | autenticado | registrar/alterar voto |
| `DELETE` | `/api/recipes/:recipeId/vote` | autenticado | remover voto |
| `GET` | `/api/recipes/:recipeId/comments` | público | listar comentários |
| `POST` | `/api/recipes/:recipeId/comments` | autenticado | criar comentário |
| `PATCH` | `/api/recipe-comments/:commentId` | dono | editar comentário próprio |
| `DELETE` | `/api/recipe-comments/:commentId` | dono | excluir comentário próprio |
| `GET` | `/api/home-feed` | público | feed e totais da home |

A rota de detalhe é **`GET /api/recipes/:slug`**. Não existe contrato público `/api/recipes/slug/:slug`.

## Autenticação

### Cadastro

`POST /api/auth/register`

```json
{
  "name": "Pessoa Exemplo",
  "email": "pessoa@example.com",
  "password": "uma-senha-de-exemplo",
  "remember": true
}
```

`remember` é opcional. Nome, e-mail e senha são validados antes da persistência. A senha precisa ter entre 10 e 128 caracteres.

O token bruto não é devolvido no JSON; ele é usado internamente para montar o cookie `HttpOnly`.

### Login

`POST /api/auth/login`

```json
{
  "email": "pessoa@example.com",
  "password": "uma-senha-de-exemplo",
  "remember": true
}
```

Credenciais inválidas retornam mensagem genérica. O entrypoint aplica limite por e-mail e por IP.

Em produção, o cookie usa `__Host-receitando_session`, `HttpOnly`, `Secure`, `SameSite=Strict` e `Path=/`.

### Logout

`POST /api/auth/logout`

A sessão persistida é invalidada e a resposta expira o cookie do navegador.

### Rate limiting

| Ação | Limite atual |
| --- | --- |
| falhas de login por e-mail | 5 em 15 minutos |
| falhas de login por IP | 20 em 15 minutos |
| cadastro por IP | 5 em 1 hora |
| solicitação de recuperação por e-mail | 3 em 15 minutos |
| solicitação de recuperação por IP | 10 em 15 minutos |

Limites atingidos retornam HTTP `429` e `Retry-After`. E-mails e IPs usados nesses buckets são persistidos apenas por uma chave SHA-256 derivada.

## Perfil

`GET /api/auth/me` retorna o perfil autenticado.

`PATCH /api/auth/me` aceita nome, handle e avatar. Handles possuem validação, unicidade e nomes reservados.

## Recuperação de senha

### Solicitar

`POST /api/auth/forgot-password`

```json
{
  "email": "pessoa@example.com"
}
```

A resposta é deliberadamente genérica para e-mails sintaticamente válidos, exista ou não uma conta.

### Validar código

`POST /api/auth/verify-reset-code`

O código possui seis dígitos, expira, tem limite de tentativas e é persistido somente de forma derivada.

### Trocar senha

`POST /api/auth/reset-password`

Uma troca bem-sucedida invalida as sessões existentes do usuário.

## Fontes e ingredientes

`GET /api/sources` publica as fontes operacionais conhecidas.

`GET /api/ingredients` retorna ingredientes usados pelo catálogo, incluindo:

- `id`;
- `name`;
- `normalizedName`;
- `category`;
- `isStaple`;
- `usageCount`.

`isStaple` identifica ingredientes básicos que não penalizam a compatibilidade.

## Receitas

### Listagem e busca

`GET /api/recipes`

Parâmetros principais:

- `limit`: 1–60; padrão 36;
- `offset`: paginação;
- `q`: busca textual;
- `source`: filtro de fonte, como `wikibooks`.

Quando `q` é informado, a API consulta a tabela virtual FTS5 `recipe_search` e ordena por relevância com `bm25()`.

### Detalhe

`GET /api/recipes/:slug`

Retorna conteúdo culinário, ingredientes, tags, procedência da receita e atribuição da imagem.

Cada ingrediente pode incluir `isStaple`, quantidade, unidade, forma normalizada e `rawText` quando disponível.

## Matching

### Matching manual

`POST /api/recipes/match`

```json
{
  "ingredients": ["ovos", "cebolas picadas", "farinha de trigo"]
}
```

São aceitos **1 a 40 ingredientes**.

Fluxo:

1. normaliza caixa, acentos e separadores;
2. gera candidatos textuais exatos e uma forma canônica conservadora;
3. consulta `ingredients.normalized_name` e `ingredient_aliases.normalized_alias` por igualdade;
4. converte os valores para IDs canônicos;
5. exclui opcionais e `isStaple` do denominador;
6. calcula a porcentagem e ordena os resultados.

Não há equivalência automática por substring.

Resultado principal:

- `compatibility`;
- `status`;
- `foundIngredients`;
- `missingIngredients`;
- `optionalIngredients`;
- `stapleIngredients`.

### Matching pela despensa

`GET /api/recipes/match/pantry`

Exige autenticação e aplica a mesma regra de compatibilidade aos ingredientes persistidos na conta.

**Importante:** a API não altera a porcentagem por causa da validade. O ranking com prioridade de consumo é aplicado no frontend, que combina o resultado desta rota com `GET /api/pantry`.

Na interface atual, receitas com diferença de compatibilidade superior a 5 pontos continuam ordenadas pela compatibilidade. Dentro de uma diferença de até 5 pontos, a validade pode desempatar a ordem para favorecer ingredientes próximos do vencimento.

## Despensa

### Listar

`GET /api/pantry`

Exige autenticação.

Cada item retorna, entre outros campos:

```json
{
  "id": "...",
  "quantity": null,
  "unit": null,
  "expiresAt": "2026-09-01",
  "ingredientId": "...",
  "ingredientName": "Tomate",
  "normalizedName": "tomate",
  "category": "..."
}
```

A listagem ordena primeiro os itens que possuem validade, da data mais próxima para a mais distante, e depois os itens sem validade.

### Adicionar ou atualizar

`POST /api/pantry`

```json
{
  "ingredientId": "ingrediente-1",
  "quantity": 2,
  "unit": "un",
  "expiresAt": "2026-09-01"
}
```

Campos:

- `ingredientId`: obrigatório;
- `quantity`: opcional;
- `unit`: opcional;
- `expiresAt`: opcional, no formato `YYYY-MM-DD`.

Semântica de `expiresAt`:

- data válida → salva/atualiza a validade;
- `null` ou string vazia → remove a validade;
- campo omitido ao atualizar um item existente → preserva a validade atual;
- formato inválido → HTTP `400` com mensagem de data inválida.

A inclusão repetida do mesmo `ingredientId` para o mesmo usuário atualiza o registro existente em vez de criar uma duplicata.

### Remover

`DELETE /api/pantry/:itemId`

Remove somente o item pertencente ao usuário autenticado.

## Lista de compras

Não existe uma rota exclusiva de lista de compras.

A lista é derivada no frontend a partir de:

- ingredientes obrigatórios da receita;
- `GET /api/pantry`;
- `ingredientId` canônico.

Ingredientes já presentes, opcionais e básicos não entram na lista principal.

Como esse fluxo é booleano, ele ainda não calcula compras parciais por quantidade.

## Adaptação e substituições

`POST /api/recipes/:slug/adapt`

Exemplo:

```json
{
  "targetServings": 4,
  "unavailableIngredients": ["ovo"],
  "usePantry": true
}
```

Campos:

- `targetServings`: opcional; inteiro de 1 a 50;
- `unavailableIngredients`: lista opcional de nomes marcados como indisponíveis;
- `usePantry`: booleano opcional.

Quando `usePantry=true`, a rota exige autenticação.

O motor:

1. carrega a receita e seus ingredientes;
2. recalcula quantidades quando existe rendimento original utilizável;
3. incorpora faltas manuais;
4. cruza a despensa quando solicitado;
5. compara quantidades apenas quando as unidades podem ser comparadas com segurança;
6. identifica sinais do contexto culinário;
7. aplica substituições conhecidas com regras contextuais;
8. devolve confiança, mudanças e avisos.

O objeto `pantry` da resposta informa:

- `used`;
- `presentCount`;
- `missingCount`;
- `shortageCount`;
- `missingIngredientIds`;
- `shortages`.

O motor não inventa densidade para comparar massa e volume incompatíveis e pode recusar uma substituição quando o ingrediente possui papel estrutural naquele preparo.

## Favoritos e comunidade

Favoritos, votos e comentários são vinculados ao usuário autenticado nas operações de escrita. Edição/exclusão de comentários validam o dono antes da mutação.

## Home

`GET /api/home-feed` retorna receitas populares, comentários recentes e totais usados pela página inicial.

## Testes do contrato

A suíte da API chama `fetch()` dos Workers reais com um D1 simulado para validar roteamento, autenticação, autorização e persistência sem tocar no banco de produção.

Os testes cobrem, entre outros pontos:

- canonicalização e staples;
- FTS5;
- autenticação e sessão;
- rate limiting;
- despensa;
- favoritos e comunidade;
- matching;
- adaptação de receitas;
- comparação segura de unidades.

## Implementação histórica

A versão anterior em NestJS/Prisma/PostgreSQL não fica mais na árvore principal. Ela foi preservada na branch `legacy/nest-prisma`. O contrato publicado é exclusivamente o da API em `backend/worker-prototype/`.
