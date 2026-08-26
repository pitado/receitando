# Catálogo de receitas e licenças

Este documento descreve a origem das receitas exibidas no Receitando, o processo de importação e os cuidados com procedência, autoria, licença, imagens e normalização de ingredientes.

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
    C --> D[Extração de ingredientes e preparo]
    D --> E[Busca de imagem]
    E --> F[Wikimedia Commons]
    F --> G[Licença + atribuição]
    G --> H[SQL em lotes]
    H --> I[Canonicalização de ingredientes]
    I --> J[(Cloudflare D1)]
    J --> K[API do Receitando]
    K --> L[Frontend]
```

Workflow:

```text
.github/workflows/import-wikibooks.yml
```

Scripts operacionais:

```text
backend/worker-prototype/scripts/import-wikibooks-v2.mjs
backend/worker-prototype/scripts/canonicalize-ingredients.mjs
```

O primeiro importa receitas/imagens. O segundo consolida variações textuais de ingredientes para o modelo canônico usado pelo matching.

Importadores substituídos foram removidos da árvore ativa. O histórico continua disponível pelo Git.

## Critérios de entrada

O importador exige estrutura mínima suficiente para interpretar a página como receita, incluindo ingredientes e modo de preparo aproveitáveis.

Na política atual, também é exigida uma imagem livre adequada. Páginas auxiliares, índices, textos sem estrutura suficiente e receitas sem imagem compatível podem ser ignorados.

Por isso, quantidade de páginas do Wikilivros e quantidade de receitas aceitas pelo Receitando não são equivalentes.

## Sanitização do conteúdo importado

O Receitando **não renderiza HTML bruto vindo do Wikilivros**.

Durante a importação, `cleanWiki()` remove comentários, referências, templates simples e tags HTML, convertendo o conteúdo aproveitado em texto. O frontend recebe strings e as renderiza como nós de texto React, sem `dangerouslySetInnerHTML` nas telas de receita.

Essa combinação reduz o risco de XSS armazenado proveniente da fonte externa. Se futuramente a aplicação passar a aceitar ou renderizar HTML rico importado, deverá existir sanitização específica antes da renderização; o comportamento atual não deve ser substituído por HTML bruto sem essa proteção.

## Canonicalização dos ingredientes

O texto cru do Wikilivros continua preservado em `recipe_ingredients.raw_text`, mas o matching não depende dele diretamente.

Após a importação, `canonicalize-ingredients.mjs`:

1. normaliza caixa, acentos e separadores;
2. remove descrições conservadoras de preparo e tamanho;
3. trata algumas formas plurais conhecidas;
4. cria ou reutiliza um ingrediente canônico em `ingredients`;
5. registra a forma original em `ingredient_aliases` quando necessário;
6. redireciona relações de receitas e despensa ao mesmo `ingredient_id`;
7. marca ingredientes básicos pela flag `is_staple`.

Exemplos de intenção:

```text
cebola
cebolas
cebolas picadas
cebola média
        ↓
      cebola
```

O processo é deliberadamente conservador: nomes compostos que mudam o significado não são reduzidos apenas por conter a mesma palavra. Assim, `óleo de gergelim torrado` permanece diferente de `óleo`, e `açúcar de confeiteiro` permanece diferente de `açúcar`.

## Ingredientes básicos

A política atual permite marcar como básicos itens triviais, como:

- água;
- sal;
- pimenta;
- óleo genérico.

Quando `is_staple = 1`, o ingrediente continua aparecendo na receita, mas não reduz a porcentagem de compatibilidade nem entra na lista principal de faltantes.

Açúcar não é marcado como básico por padrão porque, em muitas receitas, é ingrediente estrutural e não apenas um item trivial de despensa.

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

A migration `0013_recipe_image_attribution.sql` adicionou campos próprios de procedência da imagem. O contrato público os retorna no objeto `image`, enquanto `imageUrl` permanece por compatibilidade.

A página de detalhes apresenta fonte/autor/licença da imagem e links para a página do arquivo e para a licença quando disponíveis.

## Licenças

**Licença livre não significa ausência de autoria.**

Receitas e imagens continuam sujeitas às condições definidas em suas fontes. A licença MIT do código do Receitando não muda a licença do conteúdo importado.

A aplicação deve preservar, sem inventar ou apagar, os metadados de atribuição disponibilizados pela fonte.

## Operação

A importação é acionada manualmente no GitHub Actions. A sequência atual é:

1. instalar dependências;
2. validar a sintaxe dos dois scripts de catálogo;
3. aplicar migrations;
4. importar receitas e imagens;
5. limpar conteúdo de fontes antigas conforme a política do importador;
6. canonicalizar os ingredientes e aliases;
7. otimizar índices/estatísticas do D1.

## Documentos relacionados

- [`escopo.md`](escopo.md)
- [`funcionalidades.md`](funcionalidades.md)
- [`architecture.md`](architecture.md)
- [`api.md`](api.md)
- [`database.md`](database.md)
- [`deploy.md`](deploy.md)
