import { expect, test } from "@playwright/test";

import { installApiMock } from "./api-mock";

const user = {
  id: "user-e2e",
  name: "Pessoa E2E",
  email: "pessoa@example.com",
  role: "USER",
};

test("login redireciona para a despensa sem expor token no Web Storage", async ({ page }) => {
  let authorizationHeader: string | undefined;

  await installApiMock(page, {
    "POST /api/auth/login": async ({ request }) => {
      authorizationHeader = request.headers()["authorization"];
      return {
        body: {
          user,
          expiresAt: "2026-09-26T00:00:00.000Z",
        },
      };
    },
    "GET /api/pantry": async () => ({
      body: [
        {
          id: "pantry-e2e",
          quantity: null,
          unit: null,
          expiresAt: null,
          createdAt: "2026-08-26T00:00:00.000Z",
          updatedAt: "2026-08-26T00:00:00.000Z",
          ingredientId: "ingredient-ovo",
          ingredientName: "Ovo",
          normalizedName: "ovo",
          category: "Proteínas",
        },
      ],
    }),
    "GET /api/ingredients": async () => ({ body: [] }),
  });

  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("pessoa@example.com");
  await page.getByLabel("Senha").fill("senha-segura-123");
  await page.getByLabel("Lembrar de mim").check();
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/despensa$/);
  await expect(
    page.getByRole("heading", { name: "O que já está disponível" }),
  ).toBeVisible();
  await expect(page.getByText("Ovo", { exact: true })).toBeVisible();
  await expect(page.getByText("1 ingrediente", { exact: true })).toBeVisible();

  expect(authorizationHeader).toBeUndefined();

  const storage = await page.evaluate(() => ({
    legacyLocal: window.localStorage.getItem("receitando.auth.token"),
    legacySession: window.sessionStorage.getItem("receitando.auth.token"),
    hintLocal: window.localStorage.getItem("receitando.auth.session"),
    hintSession: window.sessionStorage.getItem("receitando.auth.session"),
  }));

  expect(storage).toEqual({
    legacyLocal: null,
    legacySession: null,
    hintLocal: "1",
    hintSession: null,
  });
});

test("login inválido apresenta erro sem navegar", async ({ page }) => {
  await installApiMock(page, {
    "POST /api/auth/login": async () => ({
      status: 401,
      body: { message: "E-mail ou senha inválidos." },
    }),
  });

  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("pessoa@example.com");
  await page.getByLabel("Senha").fill("senha-incorreta-123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("alert")).toHaveText("E-mail ou senha inválidos.");
  await expect(page).toHaveURL(/\/entrar$/);
});
