export interface IngredientRecord {
  id: string;
  name: string;
  normalizedName: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIngredientRecord {
  name: string;
  normalizedName: string;
  category: string;
}

export type UpdateIngredientRecord = Partial<CreateIngredientRecord>;
