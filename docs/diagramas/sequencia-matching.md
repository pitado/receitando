# Sequência UML — busca por ingredientes

Como os ingredientes digitados ou os itens da despensa chegam à API, são normalizados, consultados no D1 e usados para calcular a compatibilidade.

**Prévia visual gerada pelo GitHub usando Mermaid:**

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant F as Frontend /combinar
    participant A as API catalog64-worker
    participant N as recipe-utils
    participant D as Cloudflare D1

    U->>F: Informa ingredientes ou usa a despensa
    alt Ingredientes digitados
        F->>A: POST /api/recipes/match
    else Usar minha despensa
        F->>A: GET /api/recipes/match/pantry
        A->>D: Consultar pantry_items por user_id
        D-->>A: Ingredientes da despensa
    end
    A->>N: Normalizar e canonicalizar nomes
    N->>D: Consultar ingredients e ingredient_aliases
    D-->>N: ingredient_id por correspondência exata
    N-->>A: IDs canônicos
    A->>D: Consultar recipes + recipe_ingredients
    D-->>A: Receitas e ingredientes
    A->>A: Ignorar opcionais e is_staple
    Note over A: Compatibilidade = encontrados / obrigatórios não básicos × 100
    A-->>F: MatchRecipeResult[] ordenado
    F-->>U: Exibe compatibilidade e ingredientes faltantes
```

**Para editar as caixas e conexões:** [abrir o arquivo-fonte `.drawio`](../../receitando-diagrama-sequencia-matching.drawio). O GitHub exibe o XML quando você abre um `.drawio` diretamente; por isso esta página fornece a visualização sem precisar instalar ou baixar nada.

[Voltar ao índice dos diagramas](../../DIAGRAMAS-EDITAVEIS.md)
