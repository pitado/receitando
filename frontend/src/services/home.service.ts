import { apiRequest } from "@/services/api-client";
import type { RecipeDifficulty } from "@/types/recipe";

export interface HomePopularRecipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  prepMinutes: number;
  servings: number;
  mealType: string;
  difficulty: RecipeDifficulty;
  likes: number;
  favorites: number;
  comments: number;
}

export interface HomeRecentComment {
  id: string;
  body: string;
  createdAt: string;
  recipeTitle: string;
  recipeSlug: string;
  authorName: string;
  authorHandle: string | null;
  avatarKey: string;
}

export interface HomeFeed {
  popular: HomePopularRecipe[];
  recentComments: HomeRecentComment[];
  totals: {
    recipes: number;
    comments: number;
    likes: number;
  };
}

export function getHomeFeed(): Promise<HomeFeed> {
  return apiRequest<HomeFeed>("/api/home-feed");
}
