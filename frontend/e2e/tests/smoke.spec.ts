import { expect, test } from "@playwright/test";

import { installApiMock } from "./api-mock";

test("home carrega, morde a marca e leva ingredientes ao combinador", async ({ page }) => {
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

  const wordmark = page.getByTestId("bite-wordmark");
  await expect(wordmark).toBeVisible();
  await wordmark.click({ position: { x: 90, y: 8 } });
  await expect(page.getByTestId("bite-mark")).toHaveCount(1);

  const arroz = page.getByRole("button", { name: "arroz", exact: true });
  const tomate = page.getByRole("button", { name: "tomate", exact: true });

  await arroz.click();
  await tomate.click();
  await expect(arroz).toHaveAttribute("aria-pressed", "true");
  await expect(tomate).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Ingredientes que você tem")).toHaveValue("arroz, tomate");

  await page.getByRole("button", { name: "Buscar receitas" }).click();

  await expect(page).toHaveURL(/\/combinar\?ingredientes=arroz%2Ctomate$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "O que dá para fazer?" }),
  ).toBeVisible();
  await expect(page.getByLabel("Adicione um ingrediente")).toBeVisible();
});

test("busca global do header abre o catálogo já filtrado", async ({ page }) => {
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
  const search = page.getByRole("searchbox", { name: "Pesquisar receitas" });
  await expect(search).toBeVisible();
  await search.fill("bolo de cenoura");
  await search.press("Enter");

  await expect(page).toHaveURL(/\/receitas\?q=bolo(?:\+|%20)de(?:\+|%20)cenoura$/);
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
