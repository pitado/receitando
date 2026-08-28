import { apiRequest } from "@/services/api-client";

export interface PantryItem {
  id: string;
  quantity: number | null;
  unit: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  ingredientId: string;
  ingredientName: string;
  normalizedName: string;
  category: string;
}

export interface IngredientOption {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  usageCount?: number;
}

export function getPantry(): Promise<PantryItem[]> {
  return apiRequest<PantryItem[]>("/api/pantry");
}

export function getIngredients(): Promise<IngredientOption[]> {
  return apiRequest<IngredientOption[]>("/api/ingredients");
}

export function savePantryItem(
  ingredientId: string,
  quantity: number | null,
  unit: string | null,
  expiresAt?: string | null,
): Promise<PantryItem[]> {
  const payload: {
    ingredientId: string;
    quantity: number | null;
    unit: string | null;
    expiresAt?: string | null;
  } = { ingredientId, quantity, unit };

  if (expiresAt !== undefined) payload.expiresAt = expiresAt;

  return apiRequest<PantryItem[]>("/api/pantry", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function removePantryItem(id: string): Promise<PantryItem[]> {
  return apiRequest<PantryItem[]>(`/api/pantry/${encodeURIComponent(id)}`, { method: "DELETE" });
}
