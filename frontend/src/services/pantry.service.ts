import { apiRequest } from "@/services/api-client";

export const PANTRY_CHANGED_EVENT = "receitando:pantry-changed";

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

function notifyPantryChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PANTRY_CHANGED_EVENT));
}

export function getPantry(): Promise<PantryItem[]> {
  return apiRequest<PantryItem[]>("/api/pantry");
}

export function getIngredients(): Promise<IngredientOption[]> {
  return apiRequest<IngredientOption[]>("/api/ingredients");
}

export async function savePantryItem(
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

  const pantry = await apiRequest<PantryItem[]>("/api/pantry", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  notifyPantryChanged();
  return pantry;
}

export async function removePantryItem(id: string): Promise<PantryItem[]> {
  const pantry = await apiRequest<PantryItem[]>(`/api/pantry/${encodeURIComponent(id)}`, { method: "DELETE" });
  notifyPantryChanged();
  return pantry;
}
