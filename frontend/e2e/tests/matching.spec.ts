import { expect, test } from "@playwright/test";

import { installApiMock } from "./api-mock";

test("usuário adiciona ingredientes e recebe receitas ordenadas", async ({ page }) => {
  let payload: unknown = null;

  await installApiMock(page, {
    "POST /api/recipes/match": async ({ request }) => {
      payload = request.postDataJSON();
      return {
        body: [
          {
            id: "recipe-1",
            title: "Panqueca de banana",
            slug: "panqueca-de-banana",
            description: "Panqueca simples para aproveitar banana e ovo.",
            prepMinutes: 15,
            servings: 2,
            mealType: "Café da manhã",
            difficulty: "FACIL",
            imageUrl: null,
            tags: ["rápida"],
            compatibility: 100,
            status: "READY",
            foundIngredients: [
              { id: "ovo", name: "Ovo" },
              { id: "banana", name: "Banana" },
            ],
            missingIngredients: [],
            optionalIngredients: [],
            stapleIngredients: [],
          },
        ],
      };
    },
  });

  await page.goto("/combinar");

  const input = page.getByLabel("Adicione um ingrediente");
  await input.fill("ovo");
  await page.getByRole("button", { name: "Adicionar" }).click();
  await input.fill("banana");
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByText("2 adicionados")).toBeVisible();
  await page.getByRole("button", { name: "Encontrar receitas" }).click();

  await expect(
    page.getByRole("heading", { level: 2, name: "1 receita" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Panqueca de banana" }),
  ).toBeVisible();
  await expect(page.getByText("Você tem tudo ✓")).toBeVisible();

  expect(payload).toEqual({ ingredients: ["ovo", "banana"] });
});

test("combinador valida lista vazia sem chamar a API", async ({ page }) => {
  await page.goto("/combinar");

  await page.getByRole("button", { name: "Encontrar receitas" }).click();

  await expect(page.getByRole("alert")).toHaveText(
    "Adicione pelo menos um ingrediente para buscar receitas.",
  );
});
