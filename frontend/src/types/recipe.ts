export type RecipeDifficulty = "FACIL" | "MEDIA" | "DIFICIL";
export type RecipeSourceType = "OWN" | "OPEN_DATASET" | "USER";
export type RecipeMatchStatus = "READY" | "ALMOST_READY" | "NEAR" | "EXPLORE";
export type AdaptationConfidence = "HIGH" | "MEDIUM" | "LOW";
export type CulinarySignal =
  | "BAKED"
  | "FRIED"
  | "COOKED"
  | "FRESH"
  | "AERATED"
  | "EGG_CENTRIC"
  | "SWEET"
  | "SAVORY";

export interface Ingredient {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  isStaple?: boolean;
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
  isStaple?: boolean;
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
  stapleIngredients?: MatchIngredient[];
}

export interface MatchRecipesPayload {
  ingredients: string[];
}

export interface RecipeAdaptationPayload {
  targetServings?: number;
  unavailableIngredients: string[];
  usePantry?: boolean;
}

export interface RecipeAdaptationSubstitutionOption {
  name: string;
  ratio: number;
  confidence: AdaptationConfidence;
  reason: string;
}

export interface RecipeAdaptationIngredient {
  ingredientId: string;
  originalName: string;
  adaptedName: string;
  optional: boolean;
  unavailable: boolean;
  original: {
    quantity: number | null;
    unit: string | null;
    rawText: string | null;
  };
  adapted: {
    quantity: number | null;
    unit: string | null;
    displayAmount: string | null;
  };
  substitution: {
    recommended: RecipeAdaptationSubstitutionOption;
    alternatives: RecipeAdaptationSubstitutionOption[];
  } | null;
  warnings: string[];
}

export interface RecipeAdaptationResult {
  engineVersion: "1.0";
  recipeTitle: string;
  originalServings: number | null;
  targetServings: number | null;
  scaleFactor: number;
  confidence: number;
  ingredients: RecipeAdaptationIngredient[];
  changes: Array<{
    type: "SCALE" | "SUBSTITUTION";
    ingredientId?: string;
    message: string;
  }>;
  warnings: string[];
  culinaryContext: {
    signals: CulinarySignal[];
    evidence: string[];
  };
  pantry: {
    used: boolean;
    presentCount: number;
    missingCount: number;
    shortageCount: number;
    missingIngredientIds: string[];
    shortages: Array<{
      ingredientId: string;
      ingredientName: string;
      shortage: string | null;
    }>;
  };
}
