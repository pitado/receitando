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
  imageUrl: string | null;
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

// Cabeçalho e página inicial consultam o mesmo feed: compartilhe a chamada em voo.
let inFlight: Promise<HomeFeed> | null = null;
let cached: { value: HomeFeed; storedAt: number } | null = null;
const CACHE_TTL_MS = 20_000;

export function getHomeFeed(): Promise<HomeFeed> {
  if (cached && Date.now() - cached.storedAt < CACHE_TTL_MS) {
    return Promise.resolve(cached.value);
  }
  if (inFlight) return inFlight;

  inFlight = apiRequest<HomeFeed>("/api/home-feed")
    .then((result) => {
      cached = { value: result, storedAt: Date.now() };
      return result;
    })
    .finally(() => { inFlight = null; });

  return inFlight;
}
