import type { Metadata } from "next";

import { RecipesCatalog } from "@/components/recipe/RecipesCatalog";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ApiError } from "@/services/api-client";
import { listRecipes } from "@/services/recipes.service";
import type { RecipeCatalogResponse } from "@/types/recipe";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Receitas",
  description: "Explore o catálogo de receitas do Receitando.",
};

const INITIAL_RECIPE_LIMIT = 36;

type RecipesPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

function getCatalogError(error: unknown): string {
  if (error instanceof ApiError && error.kind === "connection") {
    return "Não foi possível carregar o catálogo. Confira se a API está ligada e tente novamente.";
  }

  return "Não foi possível carregar o catálogo agora. Tente novamente.";
}

function emptyCatalog(query = ""): RecipeCatalogResponse {
  return {
    items: [],
    pagination: {
      total: 0,
      limit: INITIAL_RECIPE_LIMIT,
      offset: 0,
      hasMore: false,
    },
    filters: {
      query,
      source: "",
      mealType: "",
      difficulty: "",
      maxPrepMinutes: null,
      sort: "recent",
    },
  };
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return value?.trim() ?? "";
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const params = await searchParams;
  const initialQuery = firstParam(params.q);
  let catalog = emptyCatalog(initialQuery);
  let errorMessage = "";

  try {
    catalog = await listRecipes({
      limit: INITIAL_RECIPE_LIMIT,
      query: initialQuery || undefined,
    });
  } catch (error: unknown) {
    errorMessage = getCatalogError(error);
  }

  return (
    <div className={`container page-shell ${styles.page}`}>
      <SectionTitle
        as="h1"
        description="Receitas simples para transformar os ingredientes da sua cozinha em comida de verdade."
        eyebrow="Catálogo"
      >
        Encontre uma receita para hoje
      </SectionTitle>

      <RecipesCatalog
        initialCatalog={catalog}
        initialError={errorMessage}
        key={initialQuery || "catalogo"}
      />
    </div>
  );
}
