import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/api-client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "@/services/api-client";

import { addFavorite, listFavorites, removeFavorite } from "./favorites.service";
import { getIngredients, getPantry, removePantryItem, savePantryItem } from "./pantry.service";
import {
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

  it("consulta catálogo e receita por slug escapado", async () => {
    const controller = new AbortController();

    await listRecipes(controller.signal);
    await getRecipeBySlug("bolo/chocolate", controller.signal);

    expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/recipes", { signal: controller.signal });
    expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/recipes/bolo%2Fchocolate", {
      signal: controller.signal,
    });
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
});
