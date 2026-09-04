import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api-client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "@/services/api-client";

import {
  listRecipeSubmissions,
  moderateRecipeSubmission,
} from "./admin-recipe-submissions.service";
import { addFavorite, listFavorites, removeFavorite } from "./favorites.service";
import { getIngredients, getPantry, removePantryItem, savePantryItem } from "./pantry.service";
import {
  adaptRecipe,
  getRecipeBySlug,
  listRecipes,
  matchRecipes,
  matchRecipesFromPantry,
} from "./recipes.service";

const apiRequestMock = vi.mocked(apiRequest);

describe("contratos dos serviços HTTP", () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
    apiRequestMock.mockResolvedValue([]);
  });

  it("consulta catálogo v2 com paginação e filtros", async () => {
    const controller = new AbortController();

    await listRecipes({
      limit: 36,
      offset: 36,
      query: "bolo de chocolate",
      source: "wikibooks",
      mealType: "Sobremesa",
      difficulty: "FACIL",
      maxPrepMinutes: 45,
      sort: "popular",
      signal: controller.signal,
    });
    await getRecipeBySlug("bolo/chocolate", controller.signal);

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      "/api/v2/recipes?q=bolo+de+chocolate&source=wikibooks&mealType=Sobremesa&difficulty=FACIL&maxPrepMinutes=45&sort=popular&limit=36&offset=36",
      { signal: controller.signal },
    );
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/recipes/bolo%2Fchocolate", {
      signal: controller.signal,
    });
  });

  it("mantém a rota simples do catálogo v2 quando não há filtros", async () => {
    await listRecipes();

    expect(apiRequestMock).toHaveBeenCalledWith("/api/v2/recipes", { signal: undefined });
  });

  it("envia ingredientes para o matching e consulta matching da despensa", async () => {
    const controller = new AbortController();

    await matchRecipes(["ovo", "farinha"], controller.signal);
    await matchRecipesFromPantry(controller.signal);

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/recipes/match", {
      method: "POST",
      body: JSON.stringify({ ingredients: ["ovo", "farinha"] }),
      signal: controller.signal,
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/recipes/match/pantry", {
      signal: controller.signal,
    });
  });

  it("envia a configuração da adaptação para a receita correta", async () => {
    const controller = new AbortController();
    const payload = {
      targetServings: 4,
      unavailableIngredients: ["leite", "manteiga"],
      usePantry: true,
    };

    await adaptRecipe("bolo/chocolate", payload, controller.signal);

    expect(apiRequestMock).toHaveBeenCalledWith("/api/recipes/bolo%2Fchocolate/adapt", {
      method: "POST",
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  });

  it("usa as rotas corretas para listar e alterar a despensa", async () => {
    await getPantry();
    await getIngredients();
    await savePantryItem("ingrediente-1", 2, "un");
    await removePantryItem("item/1");

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/pantry");
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/ingredients");
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/pantry", {
      method: "POST",
      body: JSON.stringify({ ingredientId: "ingrediente-1", quantity: 2, unit: "un" }),
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(4, "/api/pantry/item%2F1", {
      method: "DELETE",
    });
  });

  it("usa as rotas corretas para favoritos", async () => {
    const controller = new AbortController();

    await listFavorites(controller.signal);
    await addFavorite("recipe/1", controller.signal);
    await removeFavorite("recipe/1", controller.signal);

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/favorites", {
      signal: controller.signal,
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/favorites", {
      method: "POST",
      body: JSON.stringify({ recipeId: "recipe/1" }),
      signal: controller.signal,
    });
    expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/favorites/recipe%2F1", {
      method: "DELETE",
      signal: controller.signal,
    });
  });

  it("lista todas as submissões e envia o motivo da rejeição para a moderação", async () => {
    await listRecipeSubmissions("ALL");
    await moderateRecipeSubmission("submission/1", "REJECTED", "Faltam etapas do preparo.");

    expect(apiRequestMock).toHaveBeenNthCalledWith(
      1,
      "/api/admin/recipe-submissions?status=ALL",
    );
    expect(apiRequestMock).toHaveBeenNthCalledWith(
      2,
      "/api/admin/recipe-submissions/submission%2F1",
      {
        method: "PATCH",
        body: JSON.stringify({
          status: "REJECTED",
          reason: "Faltam etapas do preparo.",
        }),
      },
    );
  });
});
