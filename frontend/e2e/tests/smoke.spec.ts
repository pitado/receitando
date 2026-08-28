import { expect, test } from "@playwright/test";

import { installApiMock } from "./api-mock";

test("home carrega e leva ingredientes ao combinador", async ({ page }) => {
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

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Cozinhe com o que você já tem.",
    }),
  ).toBeVisible();

  const heroImage = page.locator('img[src="/receitando-hero-personagem-v3.png"]');
  await expect(heroImage).toBeVisible();
  await expect
    .poll(() =>
      heroImage.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
    )
    .toBe(true);

  await page.getByRole("button", { name: "arroz", exact: true }).click();
  await page.getByRole("button", { name: "tomate", exact: true }).click();
  await expect(page.getByLabel("Ingredientes que você tem")).toHaveValue("arroz, tomate");

  await page.getByRole("button", { name: "Buscar receitas" }).click();

  await expect(page).toHaveURL(/\/combinar\?ingredientes=arroz%2Ctomate$/);
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
