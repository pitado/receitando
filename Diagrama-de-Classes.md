# Diagrama UML de Classes — Frontend

**Visualização direta no GitHub:** o desenho UML aparece abaixo. Não é uma imagem estática; o diagrama é gerado a partir do código Mermaid desta página.

Contratos TypeScript utilizados no Receitando. Não é um diagrama do banco.

```mermaid
classDiagram
    class Recipe {
      +string id
      +string title
      +string slug
      +string description
      +string mealType
      +string difficulty
      +number prepMinutes
      +number servings
      +RecipeIngredient[] ingredients
      +string[] tags
    }
    class Ingredient {
      +string id
      +string name
      +string normalizedName
      +string category
      +boolean isStaple
    }
    class RecipeIngredient {
      +string ingredientId
      +string name
      +number quantity
      +string unit
      +boolean optional
    }
    class RecipeCatalogResponse {
      +RecipeCatalogItem[] items
      +object pagination
      +object filters
    }
    class RecipeCatalogItem {
      +string id
      +string title
      +string slug
      +string difficulty
      +string imageUrl
    }
    class MatchRecipeResult {
      +string id
      +number compatibility
      +RecipeMatchStatus status
      +MatchIngredient[] foundIngredients
      +MatchIngredient[] missingIngredients
    }
    class RecipeAdaptationResult {
      +string engineVersion
      +number scaleFactor
      +number confidence
      +RecipeAdaptationIngredient[] ingredients
    }
    class RecipeAdaptationIngredient {
      +string ingredientId
      +string originalName
      +string adaptedName
      +boolean optional
      +boolean unavailable
    }
    Recipe "1" *-- "0..*" RecipeIngredient : ingredients
    RecipeIngredient --> Ingredient : ingredientId
    RecipeCatalogResponse "1" *-- "0..*" RecipeCatalogItem : items
    RecipeAdaptationResult "1" *-- "0..*" RecipeAdaptationIngredient : ingredients
```

**Editar em PlantUML:** [abrir o arquivo-fonte `receitando-contratos-dados-frontend.puml`](receitando-contratos-dados-frontend.puml).

**Base técnica:** [System Design](docs/system-design-fase4.md) · [schema PostgreSQL](backend/worker-prototype/migrations/postgres/0001_baseline.sql) · [índice de diagramas](DIAGRAMAS-EDITAVEIS.md).
