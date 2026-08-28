import { apiRequest } from "@/services/api-client";
import type {
  MatchRecipeResult,
  MatchRecipesPayload,
  Recipe,
  RecipeAdaptationPayload,
  RecipeAdaptationResult,
  RecipeCatalogResponse,
  RecipeCatalogSort,
  RecipeDifficulty,
} from "@/types/recipe";

export interface ListRecipesOptions {
  limit?: number;
  offset?: number;
  query?: string;
  source?: string;
  mealType?: string;
  difficulty?: RecipeDifficulty;
  maxPrepMinutes?: number;
  sort?: RecipeCatalogSort;
  signal?: AbortSignal;
}

export function listRecipes(options: ListRecipesOptions = {}): Promise<RecipeCatalogResponse> {
  const params = new URLSearchParams();
  const query = options.query?.trim();
  const source = options.source?.trim();
  const mealType = options.mealType?.trim();

  if (query) params.set("q", query);
  if (source) params.set("source", source);
  if (mealType) params.set("mealType", mealType);
  if (options.difficulty) params.set("difficulty", options.difficulty);
  if (typeof options.maxPrepMinutes === "number") {
    params.set("maxPrepMinutes", String(options.maxPrepMinutes));
  }
  if (options.sort) params.set("sort", options.sort);
  if (typeof options.limit === "number") params.set("limit", String(options.limit));
  if (typeof options.offset === "number") params.set("offset", String(options.offset));

  const search = params.toString();
  return apiRequest<RecipeCatalogResponse>(`/api/v2/recipes${search ? `?${search}` : ""}`, {
    signal: options.signal,
  });
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
