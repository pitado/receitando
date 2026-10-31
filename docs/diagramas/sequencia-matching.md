# Sequência UML — busca por ingredientes

Como os ingredientes digitados ou os itens da despensa chegam à API, são normalizados, consultados no PostgreSQL e usados para calcular a compatibilidade.

**Prévia visual gerada pelo GitHub usando Mermaid:**

```mermaid
sequenceDiagram
    autonumber
    actor U as Usuário
    participant F as Frontend /combinar
    participant A as API catalog64-worker
    participant N as recipe-utils
    participant H as Cloudflare Hyperdrive
    participant D as Neon PostgreSQL

    U->>F: Informa ingredientes ou usa a despensa
    alt Ingredientes digitados
        F->>A: POST /api/recipes/match
    else Usar minha despensa
        F->>A: GET /api/recipes/match/pantry
        A->>H: SQL parametrizado de pantry_items
        H->>D: SELECT por user_id
        D-->>H: Ingredientes da despensa
        H-->>A: Resultado
    end
    A->>N: Normalizar e canonicalizar nomes
    N-->>A: Ingredientes normalizados
    A->>H: Resolver ingredients e ingredient_aliases
    H->>D: SELECT indexado
    D-->>H: Correspondências exatas
    H-->>A: IDs canônicos
    A->>H: Consultar recipes + recipe_ingredients
    H->>D: SELECT / JOIN
    D-->>H: Receitas e ingredientes
    H-->>A: Resultado SQL
    A->>A: Ignorar opcionais e is_staple
    Note over A: Compatibilidade = encontrados / obrigatórios não básicos × 100
    A-->>F: MatchRecipeResult[] ordenado
    F-->>U: Exibe compatibilidade e ingredientes faltantes
```

**Fonte UML textual editável:** [receitando-diagrama-sequencia-matching.puml](../../receitando-diagrama-sequencia-matching.puml). Esta página mostra a prévia Mermaid diretamente no GitHub.

[Voltar ao índice dos diagramas](../../DIAGRAMAS-EDITAVEIS.md)
