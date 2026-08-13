export interface Ingredient {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecipeIngredient {
  id?: string;
  quantity: number | string | null;
  unit: string | null;
  optional: boolean;
  ingredient: Ingredient;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string | string[];
  prepMinutes: number;
  servings: number;
  ingredients: RecipeIngredient[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchRecipeResult {
  id: string;
  title: string;
  slug: string;
  description?: string;
  prepMinutes?: number;
  servings?: number;
  compatibility: number;
  requiredIngredients: string[];
  foundIngredients: string[];
  missingIngredients: string[];
}

export interface MatchRecipesPayload {
  ingredients: string[];
}
