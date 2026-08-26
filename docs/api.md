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
- login e cadastro passam por rate limiting antes de chegar às rotas de autenticação.

> A migração para cookie `HttpOnly` está sendo tratada separadamente nos PRs de segurança #99–#101 e não faz parte desta refatoração estrutural.

## Mapa completo de rotas

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
| `GET` | `/api/recipes` | público | listar receitas |
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

```json
{
  "email": "pessoa@example.com",
  "password": "uma-senha-de-exemplo"
}
```

Credenciais inválidas retornam a mesma mensagem genérica. O entrypoint aplica limite por e-mail e por IP para reduzir força bruta.

### Rate limiting

A proteção atual inclui políticas independentes para:

- tentativas de login por e-mail;
- tentativas de login por IP;
- criação de contas por IP.

Quando o limite é atingido, a API retorna `429` e `Retry-After`.

Os identificadores usados no rate limiting são armazenados no D1 apenas como hash.

## Perfil

`GET /api/auth/me` retorna o perfil autenticado.

`PATCH /api/auth/me` aceita:

```json
{
  "name": "Novo Nome",
  "handle": "meu_usuario",
  "avatarKey": "lemon"
}
```

Handles possuem validação, unicidade e nomes reservados.

## Recuperação de senha

### Solicitar

`POST /api/auth/forgot-password`

```json
{
  "email": "pessoa@example.com"
}
```

Para e-mails sintaticamente válidos, a resposta é deliberadamente genérica exista ou não uma conta:

```json
{
  "message": "Se este e-mail estiver cadastrado, você receberá um código de recuperação.",
  "resetId": "..."
}
```

Isso evita enumeração de contas.

### Validar código

`POST /api/auth/verify-reset-code`

```json
{
  "resetId": "...",
  "code": "123456"
}
```

O código expira, possui limite de tentativas e é persistido somente de forma derivada.

### Trocar senha

`POST /api/auth/reset-password`

```json
{
  "resetId": "...",
  "resetToken": "...",
  "password": "nova-senha-segura"
}
```

Uma troca bem-sucedida invalida as sessões existentes do usuário.

## Fontes

`GET /api/sources` publica as fontes operacionais conhecidas. Para `wikibooks`, a resposta inclui nome, homepage, licença, URL da licença, idioma e quantidade importada.

## Ingredientes

`GET /api/ingredients` retorna ingredientes usados pelo catálogo, incluindo forma normalizada, categoria e contagem de uso quando aplicável.

## Receitas

### Listagem

`GET /api/recipes`

Parâmetros:

- `limit`: 1–60; padrão 36;
- `offset`: paginação;
- `q`: busca por título;
- `source`: filtro de fonte, como `wikibooks`.

### Detalhe

`GET /api/recipes/:slug`

Exemplo:

```text
/api/recipes/bolo-de-banana
```

O detalhe retorna conteúdo culinário, ingredientes, tags, procedência da receita e atribuição da imagem.

Exemplo resumido:

```json
{
  "id": "...",
  "title": "...",
  "slug": "...",
  "imageUrl": "https://upload.wikimedia.org/...",
  "source": {
    "name": "Wikilivros",
    "url": "https://pt.wikibooks.org/...",
    "author": "...",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/"
  },
  "image": {
    "url": "https://upload.wikimedia.org/...",
    "source": "Wikimedia Commons",
    "author": "...",
    "pageUrl": "https://commons.wikimedia.org/wiki/File:...",
    "license": "...",
    "licenseUrl": "...",
    "alt": "..."
  }
}
```

`imageUrl` é mantido por compatibilidade. O objeto `image` é a fonte canônica para atribuição específica da fotografia/ilustração.

## Matching

`POST /api/recipes/match`

```json
{
  "ingredients": ["ovo", "banana", "farinha de trigo", "leite"]
}
```

São aceitos **1 a 40 ingredientes**. A API normaliza nomes, consulta aliases e retorna receitas candidatas ordenadas por compatibilidade.

Cada resultado pode incluir:

- `compatibility`;
- `status`;
- `foundIngredients`;
- `missingIngredients`;
- `optionalIngredients`.

Estados:

```text
READY
ALMOST_READY
NEAR
EXPLORE
```

`GET /api/recipes/match/pantry` usa os ingredientes persistidos da conta autenticada.

## Despensa

`GET /api/pantry`, `POST /api/pantry` e `DELETE /api/pantry/:itemId` exigem autenticação.

Exemplo de inclusão:

```json
{
  "ingredientId": "id-do-ingrediente",
  "quantity": 2,
  "unit": "unidade"
}
```

Remoções usam simultaneamente o ID do item e o `user_id` autenticado, impedindo exclusão de itens de outra conta.

## Favoritos

`GET /api/favorites`, `POST /api/favorites` e `DELETE /api/favorites/:recipeId` exigem sessão. A relação é sempre vinculada ao usuário autenticado.

## Comunidade

### Votos

`PUT /api/recipes/:recipeId/vote` aceita:

```json
{
  "vote": "LIKE"
}
```

Também aceita `DISLIKE`. A combinação usuário/receita é única.

### Comentários

Comentários possuem entre 2 e 1200 caracteres. Edição/exclusão validam o dono do comentário antes da mutação.

## Home

`GET /api/home-feed` retorna receitas populares, comentários recentes e totais usados pela página inicial.

## Testes do contrato

A suíte da API chama `fetch()` dos Workers reais com um D1 simulado para validar roteamento, autenticação, autorização e persistência sem tocar no banco de produção.

Ela cobre, entre outros:

- cadastro e sessão;
- despensa;
- favoritos;
- perfil;
- votos e comentários;
- recuperação sem enumeração de e-mail;
- matching e limite de entrada;
- detalhe de receita e atribuição de imagem;
- feed da home;
- delegação pela cadeia de Workers.

## Implementação histórica

`backend/` contém a primeira versão em NestJS/Prisma/PostgreSQL. Ela é referência histórica e não define o contrato publicado. A API atual está em `backend/worker-prototype/`.
