export type RecipeDifficulty = "FACIL" | "MEDIA" | "DIFICIL";
export type RecipeSourceType = "OWN" | "OPEN_DATASET" | "USER";
export type RecipeMatchStatus = "READY" | "ALMOST_READY" | "NEAR" | "EXPLORE";

export interface Ingredient {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecipeIngredient {
  ingredientId: string;
  name: string;
  normalizedName: string;
  category: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
  rawText?: string | null;
}

export interface RecipeImageAttribution {
  url: string | null;
  source: string | null;
  author: string | null;
  pageUrl: string | null;
  license: string | null;
  licenseUrl: string | null;
  alt: string | null;
}

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string | string[];
  prepMinutes: number;
  servings: number;
  mealType: string;
  difficulty: RecipeDifficulty;
  source: {
    type: RecipeSourceType;
    name: string;
    url?: string | null;
    author?: string | null;
    license?: string | null;
    licenseUrl?: string | null;
    language?: string | null;
    externalSource?: string | null;
  };
  imageUrl: string | null;
  image?: RecipeImageAttribution;
  tags: string[];
  ingredients: RecipeIngredient[];
}

export interface MatchIngredient {
  id: string;
  name: string;
}

export interface MatchRecipeResult {
  id: string;
  title: string;
  slug: string;
  description: string;
  prepMinutes: number;
  servings: number;
  mealType: string;
  difficulty: RecipeDifficulty;
  imageUrl: string | null;
  image?: RecipeImageAttribution;
  tags: string[];
  compatibility: number;
  status: RecipeMatchStatus;
  foundIngredients: MatchIngredient[];
  missingIngredients: MatchIngredient[];
  optionalIngredients: MatchIngredient[];
}

export interface MatchRecipesPayload {
  ingredients: string[];
}
