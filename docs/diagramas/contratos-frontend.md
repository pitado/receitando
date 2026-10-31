# Contratos TypeScript do frontend

Principais tipos e interfaces de `frontend/src/types/recipe.ts`. Este é um modelo lógico do frontend, não um diagrama de banco.

**Prévia visual gerada pelo GitHub usando Mermaid:**

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

**Fonte UML textual editável:** [receitando-contratos-dados-frontend.puml](../../receitando-contratos-dados-frontend.puml). Os tipos de código continuam em [recipe.ts](../../frontend/src/types/recipe.ts).

[Voltar ao índice dos diagramas](../../DIAGRAMAS-EDITAVEIS.md)
