# Scripts da API Worker

Esta pasta contém somente utilitários que fazem parte da operação atual do catálogo.

## `import-wikibooks-v2.mjs`

É o **importador oficial atual** utilizado pelo workflow de produção do catálogo.

Responsabilidades:

- descobrir páginas de receitas no Wikilivros em português;
- interpretar ingredientes e modo de preparo;
- localizar imagens com licença livre no Wikimedia Commons;
- validar metadados de procedência, autoria e licença;
- tratar respostas `429`, `5xx`, `maxlag` e outros erros temporários das APIs Wikimedia;
- respeitar intervalos entre requisições e aplicar retry com backoff;
- gravar receitas no Cloudflare D1 em lotes;
- manter apenas o catálogo operacional baseado em Wikilivros/Commons.

Workflow correspondente:

```text
.github/workflows/import-wikibooks.yml
```

## Implementações antigas

Importadores experimentais de TheMealDB, dataset de 64 mil receitas e a primeira versão do importador Wikilivros foram removidos da árvore atual do repositório. O histórico continua disponível pelo próprio Git, sem deixar arquivos obsoletos misturados com a operação de produção.

A estratégia atual é documentada em [`../../../docs/catalogo.md`](../../../docs/catalogo.md).

## Regra de manutenção

Novos scripts que alterem dados de produção devem:

1. deixar explícita a fonte dos dados;
2. preservar informações de origem, autoria e licença;
3. evitar secrets no código;
4. respeitar rate limits de APIs externas;
5. gravar no D1 de forma segura e em lotes quando necessário;
6. possuir documentação e workflow correspondente quando fizerem parte da operação oficial;
7. ser removidos da árvore ativa quando forem substituídos, mantendo o histórico apenas no Git.
