# API REST

A API do Receitando usa JSON, prefixo global `/api` e documentação OpenAPI disponível em `/api/docs` durante o desenvolvimento.

Base local:

```text
http://localhost:3333/api
```

## Convenções

- Requisições com corpo usam `Content-Type: application/json`.
- Identificadores são enviados como strings.
- Datas seguem ISO 8601.
- Campos desconhecidos ou inválidos são rejeitados pela validação global.
- Recursos inexistentes retornam `404 Not Found`.
- Duplicidade de `normalizedName` ou `slug` retorna `409 Conflict`.
- Erros internos e mensagens do banco não são expostos ao cliente.

Formato típico de erro NestJS:

```json
{
  "statusCode": 400,
  "message": ["ingredients must contain at least 1 elements"],
  "error": "Bad Request"
}
```

## Healthcheck

### `GET /api/health`

Confirma que o processo HTTP está respondendo.

Resposta `200 OK`:

```json
{
  "status": "ok"
}
```

## Ingredientes

| Método | Rota | Descrição | Sucesso |
| --- | --- | --- | --- |
| `GET` | `/api/ingredients` | lista ingredientes | `200` |
| `GET` | `/api/ingredients/:id` | busca por identificador | `200` |
| `POST` | `/api/ingredients` | cria ingrediente | `201` |
| `PATCH` | `/api/ingredients/:id` | atualiza parcialmente | `200` |
| `DELETE` | `/api/ingredients/:id` | remove ingrediente | `204` |

Corpo de criação:

```json
{
  "name": "Açúcar",
  "category": "mercearia"
}
```

`normalizedName` é calculado pelo backend e não precisa ser enviado.

Exemplo de recurso:

```json
{
  "id": "1a66fe64-4042-4a38-a1c1-eb1a14c09b2e",
  "name": "Açúcar",
  "normalizedName": "acucar",
  "category": "mercearia",
  "createdAt": "2026-01-01T12:00:00.000Z",
  "updatedAt": "2026-01-01T12:00:00.000Z"
}
```

Corpo de atualização (todos os campos são opcionais, mas o corpo não deve estar vazio):

```json
{
  "name": "Açúcar refinado",
  "category": "mercearia"
}
```

## Receitas

| Método | Rota | Descrição | Sucesso |
| --- | --- | --- | --- |
| `GET` | `/api/recipes` | lista receitas e ingredientes | `200` |
| `GET` | `/api/recipes/:id` | busca por identificador | `200` |
| `GET` | `/api/recipes/slug/:slug` | busca pelo slug público | `200` |
| `POST` | `/api/recipes` | cria receita e relações | `201` |
| `PATCH` | `/api/recipes/:id` | atualiza parcialmente | `200` |
| `DELETE` | `/api/recipes/:id` | remove receita | `204` |

Corpo de criação:

```json
{
  "title": "Panqueca de banana",
  "slug": "panqueca-de-banana",
  "description": "Panqueca rápida e macia para o café da manhã.",
  "instructions": "Amasse a banana. Misture os ingredientes. Doure dos dois lados.",
  "prepMinutes": 15,
  "servings": 2,
  "ingredients": [
    {
      "ingredientId": "1a66fe64-4042-4a38-a1c1-eb1a14c09b2e",
      "quantity": 1,
      "unit": "unidade",
      "optional": false
    },
    {
      "ingredientId": "9a74ce6b-757f-4375-b6c1-371fb785b21b",
      "quantity": 1,
      "unit": "pitada",
      "optional": true
    }
  ]
}
```

O backend valida a existência de todos os ingredientes antes de persistir a receita. Uma atualização pode alterar os dados editoriais e, quando o campo `ingredients` for enviado, substituir o conjunto de relações de forma transacional.

Exemplo resumido de resposta:

```json
{
  "id": "7419eb9c-712d-4d2e-ae13-f83ed52d9e78",
  "title": "Panqueca de banana",
  "slug": "panqueca-de-banana",
  "description": "Panqueca rápida e macia para o café da manhã.",
  "instructions": "Amasse a banana. Misture os ingredientes. Doure dos dois lados.",
  "prepMinutes": 15,
  "servings": 2,
  "ingredients": [
    {
      "quantity": 1,
      "unit": "unidade",
      "optional": false,
      "ingredient": {
        "id": "1a66fe64-4042-4a38-a1c1-eb1a14c09b2e",
        "name": "Banana",
        "normalizedName": "banana"
      }
    }
  ]
}
```

## Compatibilidade

### `POST /api/recipes/match`

Recebe de 1 a 100 nomes de ingredientes. Entradas vazias são inválidas; duplicatas deixam de contar depois da normalização.

Requisição:

```json
{
  "ingredients": [
    "ovo",
    "banana",
    "farinha de trigo",
    "leite"
  ]
}
```

Resposta `200 OK`:

```json
[
  {
    "id": "7419eb9c-712d-4d2e-ae13-f83ed52d9e78",
    "title": "Panqueca de banana",
    "slug": "panqueca-de-banana",
    "description": "Panqueca rápida e macia para o café da manhã.",
    "compatibility": 100,
    "requiredIngredients": [
      "banana",
      "ovo",
      "farinha de trigo",
      "leite"
    ],
    "foundIngredients": [
      "banana",
      "ovo",
      "farinha de trigo",
      "leite"
    ],
    "missingIngredients": []
  },
  {
    "id": "b9cc7f86-ee77-443b-b20f-55e5acc4cc4f",
    "title": "Bolo de banana",
    "slug": "bolo-de-banana",
    "description": "Bolo caseiro de banana.",
    "compatibility": 80,
    "requiredIngredients": [
      "banana",
      "ovo",
      "farinha de trigo",
      "leite",
      "fermento"
    ],
    "foundIngredients": [
      "banana",
      "ovo",
      "farinha de trigo",
      "leite"
    ],
    "missingIngredients": [
      "fermento"
    ]
  }
]
```

Cálculo:

```text
compatibility = round(
  ingredientes obrigatórios encontrados
  / total de ingredientes obrigatórios
  * 100
)
```

Somente relações com `optional = false` participam do cálculo principal. A resposta é ordenada por `compatibility` decrescente. Nomes são comparados pela forma normalizada, portanto `AÇÚCAR`, ` açúcar ` e `acucar` são equivalentes; sinônimos diferentes não são inferidos.

Exemplo com cURL:

```bash
curl -X POST http://localhost:3333/api/recipes/match \
  -H "Content-Type: application/json" \
  -d '{"ingredients":["ovo","banana","farinha de trigo","leite"]}'
```

## Swagger

Abra <http://localhost:3333/api/docs> com o backend em execução. A interface permite consultar schemas e enviar requisições para `ingredients`, `recipes` e `matching` sem instalar outro cliente HTTP.

O documento gerado pelo Swagger é a referência executável do contrato. Este arquivo explica decisões e exemplos; se houver divergência durante o desenvolvimento, ajuste a implementação e esta documentação juntos.
