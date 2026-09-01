import { apiRequest } from "@/services/api-client";

export interface RecipeSubmissionPayload {
  authorName: string;
  authorEmail?: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepMinutes?: number;
  servings?: number;
  mealType?: string;
  difficulty: "FACIL" | "MEDIA" | "DIFICIL";
  imageUrl?: string;
  website?: string;
}

export interface RecipeSubmissionResponse {
  id?: string;
  status?: "PENDING";
  message: string;
}

export function submitRecipe(
  payload: RecipeSubmissionPayload,
): Promise<RecipeSubmissionResponse> {
  return apiRequest<RecipeSubmissionResponse>("/api/recipe-submissions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
