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
- o contrato publicado nesta branch ainda utiliza `Authorization: Bearer <token>` nas rotas autenticadas;
- CORS aceita apenas origens declaradas em `FRONTEND_URL`;
- respostas sensíveis usam `Cache-Control: no-store`;
- login, cadastro e solicitação de recuperação de senha passam por rate limiting no entrypoint.

> A migração para cookie `HttpOnly` está sendo tratada separadamente nos PRs de segurança #99–#101 e não faz parte desta refatoração estrutural.

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

A rota correta de detalhe é **`GET /api/recipes/:slug`**. Não existe contrato público `/api/recipes/slug/:slug`.

## Autenticação

### Cadastro

`POST /api/auth/register`

```json
{
  "name": "Pessoa Exemplo",
  "email": "pessoa@example.com",
  "password": "uma-senha-de-exemplo"
}
```

Nome, e-mail e senha são validados antes da persistência. A senha precisa ter entre 10 e 128 caracteres.

### Login

`POST /api/auth/login`

Credenciais inválidas retornam uma mensagem genérica. O entrypoint aplica limite por e-mail e por IP para reduzir força bruta.

### Rate limiting

A proteção atual possui buckets independentes:

| Ação | Limite atual |
| --- | --- |
| falhas de login por e-mail | 5 em 15 minutos |
| falhas de login por IP | 20 em 15 minutos |
| cadastro por IP | 5 em 1 hora |
| solicitação de recuperação por e-mail | 3 em 15 minutos |
| solicitação de recuperação por IP | 10 em 15 minutos |

Quando um limite é atingido, a API retorna HTTP `429` e `Retry-After`.

E-mails e IPs usados nesses buckets não são persistidos em texto puro: o D1 recebe apenas uma chave SHA-256 derivada.

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

Para e-mails sintaticamente válidos, a resposta é deliberadamente genérica exista ou não uma conta. Isso evita enumeração de usuários. A solicitação também passa pelo rate limiting por e-mail e IP antes de chegar ao fluxo que pode disparar o Resend.

### Validar código

`POST /api/auth/verify-reset-code`

O código possui seis dígitos, expira, tem limite de tentativas e é persistido somente de forma derivada.

### Trocar senha

`POST /api/auth/reset-password`

Uma troca bem-sucedida invalida as sessões existentes do usuário.

## Fontes

`GET /api/sources` publica as fontes operacionais conhecidas. Para `wikibooks`, a resposta inclui nome, homepage, licença, URL da licença, idioma e quantidade importada.

## Ingredientes

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

Parâmetros:

- `limit`: 1–60; padrão 36;
- `offset`: paginação;
- `q`: busca textual;
- `source`: filtro de fonte, como `wikibooks`.

Quando `q` é informado, a API consulta a tabela virtual FTS5 `recipe_search`, com suporte a termos múltiplos e prefixos, e ordena os resultados por relevância com `bm25()`. A busca não depende mais de `LIKE '%termo%'` sobre todos os títulos.

### Detalhe

`GET /api/recipes/:slug`

O detalhe retorna conteúdo culinário, ingredientes, tags, procedência da receita e atribuição da imagem.

Cada ingrediente pode incluir `isStaple`, além de quantidade, unidade, forma normalizada e `rawText` quando disponível.

`imageUrl` é mantido por compatibilidade. O objeto `image` concentra a atribuição específica da fotografia/ilustração.

## Matching

`POST /api/recipes/match`

```json
{
  "ingredients": ["ovos", "cebolas picadas", "farinha de trigo"]
}
```

São aceitos **1 a 40 ingredientes**.

O fluxo atual:

1. normaliza caixa, acentos e separadores;
2. gera candidatos textuais exatos e uma forma canônica conservadora;
3. consulta `ingredients.normalized_name` e `ingredient_aliases.normalized_alias` por igualdade;
4. converte os valores para IDs canônicos;
5. exclui opcionais e ingredientes `isStaple` do denominador;
6. calcula a porcentagem e ordena os resultados.

Não há equivalência por substring. Por exemplo, informar `óleo` não faz o sistema assumir automaticamente que o usuário possui `óleo de gergelim torrado`.

### Quantidades

Nesta versão, o matching é **booleano**: considera presença ou ausência do ingrediente. Quantidade e unidade podem existir na despensa e na receita, mas não participam da porcentagem.

Assim, `1 ovo` representa presença do ingrediente `ovo`; a API ainda não verifica se a quantidade atende uma receita que exija várias unidades.

### Resultado

Cada resultado pode incluir:

- `compatibility`;
- `status`;
- `foundIngredients`;
- `missingIngredients`;
- `optionalIngredients`;
- `stapleIngredients`.

Ingredientes básicos continuam disponíveis em `stapleIngredients`, mas não reduzem a pontuação nem aparecem como faltantes principais.

Estados:

```text
READY
ALMOST_READY
NEAR
EXPLORE
```

`GET /api/recipes/match/pantry` aplica a mesma regra aos ingredientes persistidos da conta autenticada.

## Despensa

`GET /api/pantry`, `POST /api/pantry` e `DELETE /api/pantry/:itemId` exigem autenticação.

Quantidade e unidade são opcionais e atualmente informativas para o matching.

## Favoritos e comunidade

Favoritos, votos e comentários são sempre vinculados ao usuário autenticado nas operações de escrita. Edição/exclusão de comentários validam o dono antes da mutação.

## Home

`GET /api/home-feed` retorna receitas populares, comentários recentes e totais usados pela página inicial.

## Testes do contrato

A suíte da API chama `fetch()` dos Workers reais com um D1 simulado para validar roteamento, autenticação, autorização e persistência sem tocar no banco de produção.

Além dos fluxos de conta, despensa, favoritos e comunidade, os testes cobrem normalização canônica, rate limiting e regras críticas do matching.

## Implementação histórica

A versão anterior em NestJS/Prisma/PostgreSQL não fica mais na árvore principal. Ela foi preservada na branch `legacy/nest-prisma`. O contrato publicado é exclusivamente o da API em `backend/worker-prototype/`.
