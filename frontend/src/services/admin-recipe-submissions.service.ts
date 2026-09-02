import { apiRequest } from "@/services/api-client";

export type RecipeSubmissionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AdminRecipeSubmission {
  id: string;
  userId: string | null;
  authorName: string;
  authorEmail: string | null;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prepMinutes: number | null;
  servings: number | null;
  mealType: string | null;
  difficulty: "FACIL" | "MEDIA" | "DIFICIL";
  imageUrl: string | null;
  status: RecipeSubmissionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  publishedRecipeId: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ModerationResponse {
  id: string;
  status: "APPROVED" | "REJECTED";
  publishedRecipeId?: string;
  slug?: string;
  message: string;
}

export function listRecipeSubmissions(
  status: RecipeSubmissionStatus | "ALL" = "PENDING",
): Promise<AdminRecipeSubmission[]> {
  return apiRequest<AdminRecipeSubmission[]>(
    `/api/admin/recipe-submissions?status=${encodeURIComponent(status)}`,
  );
}

export function moderateRecipeSubmission(
  id: string,
  status: "APPROVED" | "REJECTED",
  reason?: string,
): Promise<ModerationResponse> {
  return apiRequest<ModerationResponse>(
    `/api/admin/recipe-submissions/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    },
  );
}
