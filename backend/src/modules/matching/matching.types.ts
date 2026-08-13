export interface MatchingRecipeIngredient {
  optional: boolean;
  ingredient: {
    name: string;
    normalizedName: string;
  };
}

export interface MatchingRecipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  prepMinutes: number;
  servings: number;
  ingredients: MatchingRecipeIngredient[];
}

export interface MatchRecipeResult {
  id: string;
  title: string;
  slug: string;
  description: string;
  prepMinutes: number;
  servings: number;
  compatibility: number;
  requiredIngredients: string[];
  foundIngredients: string[];
  missingIngredients: string[];
}

export interface MatchingRecipesReader {
  findAll(): Promise<MatchingRecipe[]>;
}
