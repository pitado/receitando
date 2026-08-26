# Scripts da API Worker

Esta pasta contém somente utilitários que fazem parte da operação atual do catálogo.

## `import-wikibooks-v2.mjs`

É o **importador oficial atual** utilizado pelo workflow do catálogo.

Responsabilidades:

- descobrir páginas de receitas no Wikilivros em português;
- interpretar ingredientes e modo de preparo;
- localizar imagens com licença livre no Wikimedia Commons;
- validar metadados de procedência, autoria e licença;
- tratar respostas `429`, `5xx`, `maxlag` e outros erros temporários das APIs Wikimedia;
- respeitar intervalos entre requisições e aplicar retry com backoff;
- gravar receitas no Cloudflare D1 em lotes;
- manter apenas o catálogo operacional baseado em Wikilivros/Commons.

## `canonicalize-ingredients.mjs`

É executado **depois da importação** para alinhar os ingredientes ao modelo canônico usado pelo matching.

Responsabilidades:

- reduzir variações gramaticais e descrições comuns de preparo para uma chave canônica;
- preservar a forma original como alias em `ingredient_aliases`;
- redirecionar relações de receitas e itens da despensa para o ingrediente canônico;
- evitar duplicidades antes de unir relações;
- marcar ingredientes básicos (`is_staple`) como água, sal, pimenta e óleo;
- manter compostos semanticamente diferentes separados, por exemplo `óleo de gergelim torrado` e `óleo`;
- executar `PRAGMA optimize` ao final da manutenção.

O script não compara ingredientes por substring. A aplicação resolve nomes e aliases normalizados para IDs canônicos.

## Workflow

Os dois scripts fazem parte de:

```text
.github/workflows/import-wikibooks.yml
```

A sequência operacional é:

1. validar os scripts;
2. aplicar migrations;
3. importar receitas e imagens;
4. canonicalizar os ingredientes importados.

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
