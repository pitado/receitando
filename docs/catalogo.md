# Catálogo de receitas e licenças

Este documento descreve a origem das receitas exibidas no Receitando, o processo de importação e os cuidados com procedência, autoria, licença e imagens.

## Fonte operacional atual

O catálogo publicado utiliza:

- **Wikilivros em português** para o conteúdo das receitas;
- **Wikimedia Commons** para imagens com licença livre compatível.

O objetivo é que cada receita importada possua estrutura culinária útil e procedência verificável.

## Fluxo

```mermaid
flowchart LR
    A[GitHub Actions] --> B[API do Wikilivros]
    B --> C[Descoberta de páginas]
    C --> D[Ingredientes e preparo]
    D --> E[Busca de imagem]
    E --> F[Wikimedia Commons]
    F --> G[Licença + atribuição]
    G --> H[SQL em lotes]
    H --> I[(Cloudflare D1)]
    I --> J[API do Receitando]
    J --> K[Frontend]
```

Workflow:

```text
.github/workflows/import-wikibooks.yml
```

Importador operacional:

```text
backend/worker-prototype/scripts/import-wikibooks-v2.mjs
```

Importadores substituídos foram removidos da árvore ativa. O histórico continua disponível pelo Git, sem confundir experimentos antigos com a rotina de produção.

## Critérios de entrada

O importador exige estrutura mínima suficiente para interpretar a página como receita, incluindo ingredientes e modo de preparo aproveitáveis.

Na política atual, também é exigida uma imagem livre adequada. Páginas auxiliares, índices, textos sem estrutura suficiente e receitas sem imagem compatível podem ser ignorados.

Por isso, quantidade de páginas do Wikilivros e quantidade de receitas aceitas pelo Receitando não são equivalentes.

## Imagens

A busca segue, em linhas gerais:

1. imagem já relacionada à página;
2. arquivos incorporados à página;
3. busca controlada no Commons pelo nome da receita quando necessário;
4. validação de relevância e licença antes de aceitar o arquivo.

Ícones, logotipos, mapas e arquivos claramente sem relação com o prato são evitados.

## Rate limits e robustez

O importador atual possui:

- intervalo mínimo entre requisições;
- tratamento de `429` e erros temporários `5xx`;
- suporte ao cabeçalho `Retry-After`;
- backoff progressivo com novas tentativas;
- tratamento de `maxlag`/limitação da API Wikimedia;
- consultas em lote;
- gravação no D1 em lotes;
- logs de progresso.

## Metadados da receita

O D1 preserva, quando aplicável:

- identificador da fonte externa;
- URL original;
- autor;
- licença;
- URL da licença;
- idioma;
- identificador externo;
- categoria externa;
- instante de importação.

A API expõe essas informações no objeto `source` da receita.

## Metadados da imagem

A migration `0013_recipe_image_attribution.sql` adicionou:

- `image_url`;
- `image_source`;
- `image_author`;
- `image_page_url`;
- `image_license`;
- `image_license_url`;
- `image_alt`.

O contrato público atual retorna esses campos em um objeto `image`:

```json
{
  "image": {
    "url": "https://upload.wikimedia.org/...",
    "source": "Wikimedia Commons",
    "author": "Autor informado pelo Commons",
    "pageUrl": "https://commons.wikimedia.org/wiki/File:...",
    "license": "CC BY-SA 4.0",
    "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
    "alt": "Descrição da imagem"
  }
}
```

`imageUrl` continua no contrato por compatibilidade com telas existentes, enquanto `image` concentra a atribuição completa.

A página de detalhes utiliza `image.alt` quando disponível e apresenta fonte/autor/licença da imagem com links para a página do arquivo e para a licença. Assim, o requisito de procedência não fica apenas armazenado no banco: ele pode ser verificado pelo usuário na interface.

## Licenças

**Licença livre não significa ausência de autoria.**

Receitas e imagens continuam sujeitas às condições definidas em suas fontes. A licença MIT do código do Receitando não muda a licença do conteúdo importado.

A aplicação deve preservar, sem inventar ou apagar, os metadados de atribuição disponibilizados pela fonte.

## Fonte única operacional

O fluxo operacional atual é Wikilivros + Wikimedia Commons. Bases testadas anteriormente não são utilizadas pelo importador de produção.

## Operação

A importação é acionada manualmente no GitHub Actions. A rotina aplica migrations, descobre páginas candidatas, interpreta receitas, valida imagens/licenças e grava dados em lotes no D1.

O importador também mantém o catálogo alinhado à política atual de fonte, removendo conteúdo de fontes antigas conforme definido na rotina operacional.

## Documentos relacionados

- [`escopo.md`](escopo.md)
- [`funcionalidades.md`](funcionalidades.md)
- [`architecture.md`](architecture.md)
- [`api.md`](api.md)
- [`database.md`](database.md)
- [`deploy.md`](deploy.md)
