import { apiRequest } from "@/services/api-client";
import type {
  MatchRecipeResult,
  MatchRecipesPayload,
  Recipe,
  RecipeAdaptationPayload,
  RecipeAdaptationResult,
} from "@/types/recipe";

export interface ListRecipesOptions {
  limit?: number;
  offset?: number;
  query?: string;
  signal?: AbortSignal;
}

export function listRecipes(options: ListRecipesOptions = {}): Promise<Recipe[]> {
  const params = new URLSearchParams();
  const query = options.query?.trim();

  if (query) params.set("q", query);
  if (typeof options.limit === "number") params.set("limit", String(options.limit));
  if (typeof options.offset === "number") params.set("offset", String(options.offset));

  const search = params.toString();
  return apiRequest<Recipe[]>(`/api/recipes${search ? `?${search}` : ""}`, {
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
