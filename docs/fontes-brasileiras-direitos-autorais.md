# Fontes brasileiras e direitos autorais — Receitando

## Princípio
O Receitando não confunde **citar a fonte** com **receber uma licença de reprodução**.
Fotografias, textos criativos, vídeos e apresentação editorial podem estar protegidos por direitos autorais, mesmo quando a receita em si é tradicional.

## Política verificada em 2026-10-30
- **TudoGostoso:** https://www.tudogostoso.com.br/termos-de-uso — proíbe cópia de imagens e textos para divulgação em outros meios sem consentimento prévio. Uso aqui: somente título, identificação da fonte e link.
- **Receiteria:** https://www.receiteria.com.br/termos-de-uso/ — proíbe republicação de conteúdo, adaptação e técnicas automatizadas de coleta sem autorização. Uso aqui: apenas links editados manualmente, sem scraping.
- **Panelinha:** https://panelinha.com.br/termos-de-uso — proíbe reprodução total ou parcial sem autorização. Uso aqui: apenas indicação com link.

## Funcionalidade implementada
- `GET /api/recipe-references`: lista indicações externas separadas das receitas locais (não entra no matching).
- `/inspiracoes`: abre a publicação original em nova aba; não usa fotos de terceiros.
- `scripts/external-references-br.json`: referências individualmente revisadas, com URL, título, fonte, créditos conhecidos e termos.
- `scripts/import-external-references.mjs`: importador com validação estrita dos domínios, campos e licença `link_only`. Execução padrão é **dry-run**. Persistência só com `--apply`, `ALLOW_EXTERNAL_REFERENCES_WRITE=true` e `POSTGRES_IMPORT_URL`.
- `migrations/postgres/0002_external_recipe_references.sql`: armazenamento isolado em Neon, sem alterar a tabela `recipes` nem criar entradas falsas de conteúdo completo.

## Para publicar conteúdo completo e fotos
Exigir autorização escrita específica ou licença inequívoca que permita reprodução para os fins do Receitando. Revisar **separadamente** licença de texto e de imagem, registrar autor, fonte, tipo de licença, link da licença, permissões comerciais e necessidade de compartilhar alterações pela mesma licença. Nunca presumir que imagem exibida publicamente é reutilizável. Testar qualidade, integridade e correção dos ingredientes antes de publicar.

O catálogo de links **não conta como receitas próprias importadas** e não é usado no cálculo de compatibilidade de ingredientes.
