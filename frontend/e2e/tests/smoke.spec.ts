import { expect, test } from "@playwright/test";

import { installApiMock } from "./api-mock";

test("home carrega e leva ao combinador", async ({ page }) => {
  await installApiMock(page, {
    "GET /api/home-feed": async () => ({
      body: {
        popular: [],
        recentComments: [],
        totals: { recipes: 12, comments: 3, likes: 8 },
      },
    }),
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Você já tem os ingredientes/i,
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: /Ver o que posso fazer/i }).click();

  await expect(page).toHaveURL(/\/combinar$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "O que dá para fazer?" }),
  ).toBeVisible();
  await expect(page.getByLabel("Adicione um ingrediente")).toBeVisible();
});

test("despensa sem sessão pede autenticação", async ({ page }) => {
  await page.goto("/despensa");

  await expect(
    page.getByRole("heading", {
      name: "Entre para guardar o que você tem em casa.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Entrar na minha conta" }),
  ).toHaveAttribute("href", "/entrar");
});
