import { apiRequest } from "@/services/api-client";
import type { Recipe } from "@/types/recipe";

export function listFavorites(signal?: AbortSignal): Promise<Recipe[]> {
  return apiRequest<Recipe[]>("/api/favorites", { signal });
}

export function addFavorite(
  recipeId: string,
  signal?: AbortSignal,
): Promise<Recipe[]> {
  return apiRequest<Recipe[]>("/api/favorites", {
    method: "POST",
    body: JSON.stringify({ recipeId }),
    signal,
  });
}

export function removeFavorite(
  recipeId: string,
  signal?: AbortSignal,
): Promise<Recipe[]> {
  return apiRequest<Recipe[]>(`/api/favorites/${encodeURIComponent(recipeId)}`, {
    method: "DELETE",
    signal,
  });
}
