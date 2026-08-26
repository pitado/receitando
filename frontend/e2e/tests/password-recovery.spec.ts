import { expect, test } from "@playwright/test";

import { installApiMock } from "./api-mock";

test("recuperação percorre e-mail, código e nova senha", async ({ page }) => {
  const calls: Array<{ path: string; body: unknown }> = [];

  await installApiMock(page, {
    "POST /api/auth/forgot-password": async ({ request, path }) => {
      calls.push({ path, body: request.postDataJSON() });
      return {
        body: {
          message: "Se este e-mail estiver cadastrado, você receberá um código de recuperação.",
          resetId: "reset-e2e",
        },
      };
    },
    "POST /api/auth/verify-reset-code": async ({ request, path }) => {
      calls.push({ path, body: request.postDataJSON() });
      return { body: { resetToken: "reset-token-e2e" } };
    },
    "POST /api/auth/reset-password": async ({ request, path }) => {
      calls.push({ path, body: request.postDataJSON() });
      return { body: { message: "Sua senha foi alterada com sucesso." } };
    },
  });

  await page.goto("/recuperar-senha");

  await page.getByLabel("E-mail").fill("pessoa@example.com");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "Digite o código" })).toBeVisible();

  await page.getByLabel("Código de 6 dígitos").fill("123456");
  await page.getByRole("button", { name: "Validar código" }).click();
  await expect(page.getByRole("heading", { name: "Crie uma nova senha" })).toBeVisible();

  await page.getByLabel("Nova senha").fill("nova-senha-segura-123");
  await page.getByLabel("Confirmar nova senha").fill("nova-senha-segura-123");
  await page.getByRole("button", { name: "Salvar nova senha" }).click();

  await expect(page.getByRole("heading", { name: "Senha alterada." })).toBeVisible();
  await expect(page.getByText("Sua senha foi alterada com sucesso.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar com a nova senha" })).toHaveAttribute(
    "href",
    "/entrar",
  );

  expect(calls).toEqual([
    {
      path: "/api/auth/forgot-password",
      body: { email: "pessoa@example.com" },
    },
    {
      path: "/api/auth/verify-reset-code",
      body: { resetId: "reset-e2e", code: "123456" },
    },
    {
      path: "/api/auth/reset-password",
      body: {
        resetId: "reset-e2e",
        resetToken: "reset-token-e2e",
        password: "nova-senha-segura-123",
      },
    },
  ]);
});
