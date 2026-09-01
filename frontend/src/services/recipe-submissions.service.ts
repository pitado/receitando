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
  image?: File;
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
  const body = new FormData();
  body.set("authorName", payload.authorName);
  body.set("authorEmail", payload.authorEmail ?? "");
  body.set("title", payload.title);
  body.set("description", payload.description);
  body.set("difficulty", payload.difficulty);
  body.set("mealType", payload.mealType ?? "");
  body.set("website", payload.website ?? "");

  if (typeof payload.prepMinutes === "number") {
    body.set("prepMinutes", String(payload.prepMinutes));
  }
  if (typeof payload.servings === "number") {
    body.set("servings", String(payload.servings));
  }

  for (const ingredient of payload.ingredients) {
    body.append("ingredients", ingredient);
  }
  for (const instruction of payload.instructions) {
    body.append("instructions", instruction);
  }
  if (payload.image) {
    body.set("image", payload.image, payload.image.name);
  }

  return apiRequest<RecipeSubmissionResponse>("/api/recipe-submissions", {
    method: "POST",
    body,
  });
}
