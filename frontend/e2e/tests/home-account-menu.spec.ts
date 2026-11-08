import { expect, test } from "@playwright/test";

import { installApiMock } from "./api-mock";

const user = {
  id: "e2e-profile",
  name: "Cozinheira Teste",
  email: "teste@example.com",
  handle: "cozinha_teste",
  avatarKey: "avocado",
  role: "USER",
};

const feed = {
  popular: [],
  recentComments: [],
  totals: { recipes: 297, comments: 0, likes: 0 },
};

test("o perfil fica antes de Enviar no mobile e permite trocar a conta", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  let loggedIn = true;
  let logoutCalls = 0;
  await installApiMock(page, {
    "GET /api/auth/me": async () =>
      loggedIn ? { body: user } : { status: 401, body: { message: "Sessão expirada." } },
    "POST /api/auth/logout": async () => {
      logoutCalls += 1;
      loggedIn = false;
      return { status: 204 };
    },
    "GET /api/home-feed": async () => ({ body: feed }),
    "GET /api/ingredients": async () => ({ body: [] }),
    "POST /api/recipes/match": async () => ({ body: [] }),
  });

  await page.goto("/");
  const search = page.getByRole("button", { name: "Buscar", exact: true });
  const brand = page.getByRole("link", { name: "Receitando — início" });
  const profile = page.getByRole("button", { name: "Conta @cozinha_teste" });
  const submit = page.getByRole("link", { name: "Enviar", exact: true });
  await expect(profile).toBeVisible();
  await expect(submit).toBeVisible();
  const [searchBox, brandBox, profileBox, submitBox] = await Promise.all([
    search.boundingBox(), brand.boundingBox(), profile.boundingBox(), submit.boundingBox(),
  ]);
  expect(searchBox && brandBox && profileBox && submitBox).toBeTruthy();
  if (searchBox && brandBox && profileBox && submitBox) {
    expect(searchBox.x + searchBox.width).toBeLessThan(brandBox.x + 4);
    expect(brandBox.x + brandBox.width).toBeLessThan(profileBox.x + 4);
    expect(profileBox.x + profileBox.width).toBeLessThan(submitBox.x + 4);
  }

  await profile.click();
  await expect(page.getByRole("link", { name: "Meu perfil" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Editar @ e avatar" })).toHaveAttribute("href", "/conta?editar=1");
  await expect(page.getByText("@cozinha_teste", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "Trocar de conta" }).click();
  await expect(page).toHaveURL(/\/entrar$/);
  expect(logoutCalls).toBe(1);
  await expect(page.getByRole("link", { name: "Entrar na minha conta" }).first()).toBeVisible();
});

test("falha ao sair mantém a sessão visível e oferece nova tentativa", async ({ page }) => {
  await installApiMock(page, {
    "GET /api/auth/me": async () => ({ body: user }),
    "POST /api/auth/logout": async () => ({ status: 503, body: { message: "Indisponível" } }),
    "GET /api/home-feed": async () => ({ body: feed }),
    "GET /api/ingredients": async () => ({ body: [] }),
    "POST /api/recipes/match": async () => ({ body: [] }),
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Conta @cozinha_teste" }).click();
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(page.getByRole("alert").first()).toContainText("Não foi possível encerrar a sessão");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "Trocar de conta" })).toBeEnabled();
});
