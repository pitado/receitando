# Scripts da API Worker

Esta pasta contém utilitários de importação e manutenção do catálogo.

## Script ativo

### `import-wikibooks-v2.mjs`

É o **importador atual** utilizado pelo workflow de produção do catálogo.

Responsabilidades:

- descobrir páginas de receitas no Wikilivros;
- interpretar ingredientes e modo de preparo;
- localizar imagens livres no Wikimedia Commons;
- validar metadados e licença;
- lidar com limites `429` e erros temporários das APIs Wikimedia;
- gravar receitas no Cloudflare D1 em lotes;
- manter o catálogo alinhado à fonte atual do projeto.

Workflow correspondente:

```text
.github/workflows/import-wikibooks.yml
```

## Scripts históricos

Os arquivos abaixo pertencem a experimentos anteriores e **não representam a fonte atual do catálogo**:

- `build-64k-import.mjs`;
- `build-themealdb-import.mjs`;
- `import-wikibooks.mjs`.

Eles não devem ser usados para repopular o banco de produção.

A estratégia atual é documentada em:

[`../../../docs/catalogo.md`](../../../docs/catalogo.md)

## Regra de manutenção

Novos scripts que alterem dados de produção devem:

1. deixar explícita a fonte dos dados;
2. preservar informações de origem e licença;
3. evitar secrets no código;
4. respeitar rate limits de APIs externas;
5. gravar no D1 de forma segura e em lotes quando necessário;
6. possuir documentação e workflow correspondente quando fizerem parte da operação oficial.
