# API do Receitando

A API de produção roda em **Cloudflare Workers**, usa **Cloudflare D1** e responde em JSON.

Base de produção:

```text
https://api.receitando.miguelpita.com.br
```

Base local padrão:

```text
http://localhost:8787
```

## Convenções

- rotas da aplicação usam prefixo `/api`;
- corpos de requisição usam `Content-Type: application/json`;
- erros seguem, em geral, `{ "statusCode": number, "message": string }`;
- rotas autenticadas usam `Authorization: Bearer <token>`;
- o token de sessão nunca deve ser commitado, logado em documentação ou compartilhado publicamente;
- CORS aceita apenas origens configuradas pelo ambiente do Worker.

## Healthcheck

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/` | público | identificação simples da API |
| `GET` | `/api/health` | público | healthcheck |

## Autenticação e perfil

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | público | criar conta e sessão |
| `POST` | `/api/auth/login` | público | autenticar usuário |
| `GET` | `/api/auth/me` | autenticado | consultar perfil atual |
| `PATCH` | `/api/auth/me` | autenticado | alterar nome, `@` e avatar |
| `POST` | `/api/auth/logout` | autenticado | encerrar sessão atual |

Exemplo de cadastro:

```json
{
  "name": "Pessoa Exemplo",
  "email": "pessoa@example.com",
  "password": "uma-senha-local-de-exemplo"
}
```

A resposta de login/cadastro inclui um token de sessão. Esse valor é credencial e deve permanecer privado.

## Recuperação de senha

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `POST` | `/api/auth/forgot-password` | público | solicitar código por e-mail |
| `POST` | `/api/auth/verify-reset-code` | público | validar código de seis dígitos |
| `POST` | `/api/auth/reset-password` | público | definir nova senha após validação |

Os códigos expiram e são armazenados apenas como hash. Tokens temporários de recuperação também não devem aparecer em logs ou documentação real.

## Ingredientes

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/ingredients` | público | listar ingredientes usados pelo catálogo |

A resposta inclui identificador, nome, forma normalizada, categoria e uso no catálogo quando disponível.

## Receitas

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/recipes` | público | listar catálogo |
| `GET` | `/api/recipes/:slug` | público | buscar receita por slug |
| `POST` | `/api/recipes/match` | público | calcular compatibilidade por ingredientes |
| `GET` | `/api/recipes/match/pantry` | autenticado | calcular compatibilidade usando a despensa |

### Listagem

`GET /api/recipes` aceita:

- `limit`: de 1 a 60, padrão 36;
- `offset`: deslocamento para paginação;
- `q`: busca simples pelo título.

Exemplo:

```text
/api/recipes?limit=24&offset=0&q=banana
```

### Matching

Requisição:

```json
{
  "ingredients": ["ovo", "banana", "farinha de trigo", "leite"]
}
```

Exemplo com cURL:

```bash
curl -X POST https://api.receitando.miguelpita.com.br/api/recipes/match \
  -H "Content-Type: application/json" \
  -d '{"ingredients":["ovo","banana","farinha de trigo","leite"]}'
```

O motor normaliza nomes, resolve aliases conhecidos, identifica ingredientes obrigatórios encontrados e faltantes e ordena os resultados pela compatibilidade.

Estados usados pelo frontend:

```text
READY
ALMOST_READY
NEAR
EXPLORE
```

## Despensa

Todas as rotas exigem autenticação.

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/api/pantry` | listar itens da despensa |
| `POST` | `/api/pantry` | adicionar ou atualizar ingrediente |
| `DELETE` | `/api/pantry/:itemId` | remover item |

Exemplo de inclusão:

```json
{
  "ingredientId": "id-do-ingrediente",
  "quantity": 2,
  "unit": "unidade"
}
```

Quantidade e unidade são opcionais para o matching; a presença do ingrediente é o dado principal.

## Favoritos

Todas as rotas exigem autenticação.

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/api/favorites` | listar receitas favoritas |
| `POST` | `/api/favorites` | salvar receita |
| `DELETE` | `/api/favorites/:recipeId` | remover dos favoritos |

## Comunidade

### Votos

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/recipes/:recipeId/social` | público | contagens e voto atual quando autenticado |
| `PUT` | `/api/recipes/:recipeId/vote` | autenticado | registrar `LIKE` ou `DISLIKE` |
| `DELETE` | `/api/recipes/:recipeId/vote` | autenticado | remover voto |

Corpo do voto:

```json
{
  "vote": "LIKE"
}
```

### Comentários

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/recipes/:recipeId/comments` | público | listar comentários |
| `POST` | `/api/recipes/:recipeId/comments` | autenticado | comentar |
| `PATCH` | `/api/recipe-comments/:commentId` | dono do comentário | editar |
| `DELETE` | `/api/recipe-comments/:commentId` | dono do comentário | excluir |

Comentários aceitam texto entre 2 e 1200 caracteres.

## Home

| Método | Rota | Acesso | Finalidade |
| --- | --- | --- | --- |
| `GET` | `/api/home-feed` | público | receitas populares, comentários recentes e totais da comunidade |

## Autenticação em requisições

Exemplo de rota protegida:

```bash
curl https://api.receitando.miguelpita.com.br/api/pantry \
  -H "Authorization: Bearer SEU_TOKEN_LOCAL"
```

`SEU_TOKEN_LOCAL` é apenas um placeholder. Nunca coloque tokens reais em commits, issues, screenshots públicos ou documentação.

## Observação sobre a implementação antiga

A pasta `backend/` contém a primeira versão em NestJS/Prisma/PostgreSQL. Ela não representa o contrato atualmente publicado. A referência de produção é o código em `backend/worker-prototype/` e esta documentação.
