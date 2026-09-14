import type { Metadata } from "next";

import { RecipesCatalog } from "@/components/recipe/RecipesCatalog";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ApiError } from "@/services/api-client";
import { listRecipes } from "@/services/recipes.service";
import type { RecipeCatalogResponse, RecipeCatalogSort, RecipeDifficulty } from "@/types/recipe";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Receitas",
  description: "Explore o catálogo de receitas do Receitando.",
};

const INITIAL_RECIPE_LIMIT = 36;

type RecipesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

function difficultyFrom(value: string): RecipeDifficulty | undefined {
  const normalized = value.toUpperCase();
  return normalized === "FACIL" || normalized === "MEDIA" || normalized === "DIFICIL"
    ? normalized
    : undefined;
}

function sortFrom(value: string, hasQuery: boolean): RecipeCatalogSort {
  const allowed: RecipeCatalogSort[] = ["relevance", "recent", "popular", "quick", "title"];
  if (allowed.includes(value as RecipeCatalogSort)) {
    if (value === "relevance" && !hasQuery) return "recent";
    return value as RecipeCatalogSort;
  }
  return hasQuery ? "relevance" : "recent";
}

function positiveNumber(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function getCatalogError(error: unknown): string {
  if (error instanceof ApiError && error.kind === "connection") {
    return "Não foi possível carregar o catálogo. Confira se a API está ligada e tente novamente.";
  }
  return "Não foi possível carregar o catálogo agora. Tente novamente.";
}

function emptyCatalog(filters: RecipeCatalogResponse["filters"]): RecipeCatalogResponse {
  return {
    items: [],
    pagination: { total: 0, limit: INITIAL_RECIPE_LIMIT, offset: 0, hasMore: false },
    filters,
  };
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const params = await searchParams;
  const query = firstParam(params.q);
  const source = firstParam(params.source).toLowerCase();
  const mealType = firstParam(params.mealType);
  const difficulty = difficultyFrom(firstParam(params.difficulty));
  const maxPrepMinutes = positiveNumber(firstParam(params.maxPrepMinutes));
  const sort = sortFrom(firstParam(params.sort), Boolean(query));

  const initialFilters: RecipeCatalogResponse["filters"] = {
    query,
    source,
    mealType,
    difficulty: difficulty ?? "",
    maxPrepMinutes: maxPrepMinutes ?? null,
    sort,
  };

  let catalog = emptyCatalog(initialFilters);
  let errorMessage = "";

  try {
    catalog = await listRecipes({
      limit: INITIAL_RECIPE_LIMIT,
      query: query || undefined,
      source: source || undefined,
      mealType: mealType || undefined,
      difficulty,
      maxPrepMinutes,
      sort,
    });
  } catch (error: unknown) {
    errorMessage = getCatalogError(error);
  }

  return (
    <div className={`container page-shell ${styles.page}`}>
      <SectionTitle
        as="h1"
        description="Busque pelo prato, filtre pelo tempo ou dificuldade e encontre uma receita que caiba no seu dia."
        eyebrow="Catálogo"
      >
        O que vai para a mesa hoje?
      </SectionTitle>

      <RecipesCatalog initialCatalog={catalog} initialError={errorMessage} />
    </div>
  );
}
