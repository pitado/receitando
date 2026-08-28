import { apiRequest } from "@/services/api-client";
import type {
  MatchRecipeResult,
  MatchRecipesPayload,
  Recipe,
  RecipeAdaptationPayload,
  RecipeAdaptationResult,
} from "@/types/recipe";

export function listRecipes(signal?: AbortSignal): Promise<Recipe[]> {
  return apiRequest<Recipe[]>("/api/recipes", { signal });
}

export function getRecipeBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<Recipe> {
  return apiRequest<Recipe>(`/api/recipes/${encodeURIComponent(slug)}`, {
    signal,
  });
}

export function matchRecipes(
  ingredients: string[],
  signal?: AbortSignal,
): Promise<MatchRecipeResult[]> {
  const payload: MatchRecipesPayload = { ingredients };

  return apiRequest<MatchRecipeResult[]>("/api/recipes/match", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

export function matchRecipesFromPantry(
  signal?: AbortSignal,
): Promise<MatchRecipeResult[]> {
  return apiRequest<MatchRecipeResult[]>("/api/recipes/match/pantry", {
    signal,
  });
}

export function adaptRecipe(
  slug: string,
  payload: RecipeAdaptationPayload,
  signal?: AbortSignal,
): Promise<RecipeAdaptationResult> {
  return apiRequest<RecipeAdaptationResult>(
    `/api/recipes/${encodeURIComponent(slug)}/adapt`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      signal,
    },
  );
}
