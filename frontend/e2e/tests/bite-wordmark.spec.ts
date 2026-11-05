import { expect, test } from "@playwright/test";

import { installApiMock } from "./api-mock";

const feed = {
  popular: [],
  recentComments: [],
  totals: { recipes: 297, comments: 0, likes: 0 },
};

async function setup(page: import("@playwright/test").Page) {
  await installApiMock(page, {
    "GET /api/home-feed": async () => ({ body: feed }),
    "GET /api/ingredients": async () => ({ body: [] }),
    "POST /api/recipes/match": async () => ({ body: [] }),
    "GET /api/auth/me": async () => ({ status: 401, body: { message: "Não autenticado" } }),
  });
}

for (const width of [375, 768, 1440]) {
  test(`mordida na marca funciona sem recarregar a home em ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 850 });
    await setup(page);
    await page.goto("/");
    const logo = page.getByRole("link", { name: "Receitando — início" });
    const word = page.locator('[data-testid="bite-wordmark"] span').first();
    await expect(logo).toBeVisible();

    await logo.click();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(async () => word.evaluate((el) => getComputedStyle(el).maskImage), { timeout: 2500 })
      .not.toBe("none");
    await testInfo.attach(`mordida-${width}.png`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await expect.poll(async () => word.evaluate((el) => getComputedStyle(el).maskImage), { timeout: 6000 })
      .toBe("none");
    await expect(logo).toBeVisible();
  });
}

test("Enter funciona sem navegação e respeita movimento reduzido", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page);
  await page.goto("/");
  const logo = page.getByRole("link", { name: "Receitando — início" });
  const word = page.locator('[data-testid="bite-wordmark"] span').first();
  await logo.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(async () => word.evaluate((el) => getComputedStyle(el).maskImage))
    .not.toBe("none");
  await expect.poll(async () => word.evaluate((el) => getComputedStyle(el).maskImage), { timeout: 6000 })
    .toBe("none");
});

test("nas outras páginas a marca continua levando para a home", async ({ page }) => {
  await setup(page);
  await page.goto("/entrar");
  await page.getByRole("link", { name: "Receitando — início" }).click();
  await expect(page).toHaveURL(/\/$/);
});
