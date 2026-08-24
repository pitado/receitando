# API de receitas do Receitando

A API de receitas tem duas camadas:

1. **API pública versionada**, usada pelo frontend e por integrações futuras;
2. **API interna de importação**, protegida por secret e usada para alimentar o catálogo a partir de fontes permitidas.

## API pública v1

Base de produção:

```text
https://api.receitando.miguelpita.com.br/api/v1
```

Rotas iniciais:

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/health` | healthcheck |
| `GET` | `/home` | feed/resumo da home |
| `GET` | `/ingredients` | ingredientes do catálogo |
| `GET` | `/recipes` | catálogo paginado |
| `GET` | `/recipes/:slug` | detalhe de receita |
| `POST` | `/match` | combinar ingredientes com receitas |
| `GET` | `/sources` | fontes de receita habilitadas |

As rotas antigas em `/api/...` continuam funcionando para não quebrar o frontend durante a migração.

### Catálogo

```http
GET /api/v1/recipes?limit=36&offset=0&q=risoto
```

`limit` tem teto para evitar respostas muito grandes. A busca `q` é opcional.

### Matching

```http
POST /api/v1/match
Content-Type: application/json

{
  "ingredients": ["tomate", "arroz", "queijo"]
}
```

O motor usa os ingredientes canônicos e aliases cadastrados no D1.

## API interna de importação

A rota de importação não é pública para usuários finais:

```http
POST /api/internal/import-recipes
Authorization: Bearer <IMPORT_API_KEY>
Content-Type: application/json

{
  "source": "themealdb",
  "query": "chicken",
  "limit": 10
}
```

A resposta informa quantas receitas foram gravadas e seus IDs/slugs.

### Segurança

`IMPORT_API_KEY` deve existir apenas em `.dev.vars` local ou como Cloudflare Secret. Nunca deve ser salvo em `wrangler.jsonc`, Markdown, código-fonte ou GitHub Actions em texto puro.

Produção:

```bash
cd backend/worker-prototype
npx wrangler secret put IMPORT_API_KEY
npx wrangler secret put THEMEALDB_API_KEY
```

Para desenvolvimento, copie `.dev.vars.example` para `.dev.vars`.

## Fontes

A primeira fonte integrada é **TheMealDB**, usando os endpoints oficiais da API. A chave de teste `1` deve ficar restrita a desenvolvimento/uso educacional; produção deve usar uma chave apropriada à forma como o projeto estiver sendo publicado.

O Receitando não deve fazer scraping indiscriminado de páginas. Antes de adicionar uma fonte nova, confirme pelo menos um destes pontos:

- API oficial permite reutilização;
- conteúdo/dataset possui licença compatível;
- o site autoriza coleta e reutilização;
- existe autorização direta do titular.

Quando uma fonte de site sem API for aprovada, o adaptador deve preferir dados estruturados (por exemplo, JSON-LD `schema.org/Recipe`) e registrar a procedência, em vez de depender de seletores HTML frágeis.

## Próximos adaptadores

Cada nova fonte deve virar um adaptador isolado. Isso permite trocar ou desligar uma fonte sem alterar a API pública do Receitando.

Fluxo esperado:

```text
fonte externa
      │
      ▼
adaptador da fonte
      │ normaliza
      ▼
modelo Receitando
      │
      ▼
Cloudflare D1
      │
      ▼
/api/v1/recipes
```
