import type { IngredientRecord } from '../ingredients/ingredient.types';

export interface RecipeIngredientRecord {
  id: string;
  quantity: number | null;
  unit: string | null;
  optional: boolean;
  ingredient: IngredientRecord;
}

export interface RecipeRecord {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  prepMinutes: number;
  servings: number;
  ingredients: RecipeIngredientRecord[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeIngredientWriteRecord {
  ingredientId: string;
  quantity?: number;
  unit?: string;
  optional: boolean;
}

export interface CreateRecipeRecord {
  title: string;
  slug: string;
  description: string;
  instructions: string;
  prepMinutes: number;
  servings: number;
  ingredients: RecipeIngredientWriteRecord[];
}

export interface UpdateRecipeRecord {
  title?: string;
  slug?: string;
  description?: string;
  instructions?: string;
  prepMinutes?: number;
  servings?: number;
  ingredients?: RecipeIngredientWriteRecord[];
}
