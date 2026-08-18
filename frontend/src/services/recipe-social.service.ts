import { apiRequest } from "@/services/api-client";

export type RecipeVote = "LIKE" | "DISLIKE";

export interface RecipeSocialSummary {
  likes: number;
  dislikes: number;
  myVote: RecipeVote | null;
}

export interface RecipeComment {
  id: string;
  recipeId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  author: {
    id: string;
    name: string;
    handle: string | null;
    avatarKey: string;
  };
}

export function getRecipeSocial(recipeId: string): Promise<RecipeSocialSummary> {
  return apiRequest<RecipeSocialSummary>(`/api/recipes/${encodeURIComponent(recipeId)}/social`);
}

export function setRecipeVote(recipeId: string, vote: RecipeVote): Promise<RecipeSocialSummary> {
  return apiRequest<RecipeSocialSummary>(`/api/recipes/${encodeURIComponent(recipeId)}/vote`, {
    method: "PUT",
    body: JSON.stringify({ vote }),
  });
}

export function removeRecipeVote(recipeId: string): Promise<RecipeSocialSummary> {
  return apiRequest<RecipeSocialSummary>(`/api/recipes/${encodeURIComponent(recipeId)}/vote`, {
    method: "DELETE",
  });
}

export function listRecipeComments(recipeId: string): Promise<RecipeComment[]> {
  return apiRequest<RecipeComment[]>(`/api/recipes/${encodeURIComponent(recipeId)}/comments`);
}

export function createRecipeComment(recipeId: string, body: string): Promise<RecipeComment[]> {
  return apiRequest<RecipeComment[]>(`/api/recipes/${encodeURIComponent(recipeId)}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function updateRecipeComment(commentId: string, body: string): Promise<RecipeComment[]> {
  return apiRequest<RecipeComment[]>(`/api/recipe-comments/${encodeURIComponent(commentId)}`, {
    method: "PATCH",
    body: JSON.stringify({ body }),
  });
}

export function deleteRecipeComment(commentId: string): Promise<RecipeComment[]> {
  return apiRequest<RecipeComment[]>(`/api/recipe-comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
  });
}
