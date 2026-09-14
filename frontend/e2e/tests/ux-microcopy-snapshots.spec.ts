import { expect, test } from "@playwright/test";

import { installApiMock } from "./api-mock";

const sizes = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 1000 },
] as const;

for (const size of sizes) {
  test(`microcopy depois — ${size.name}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await installApiMock(page, {
      "GET /api/home-feed": async () => ({ body: { popular: [], recentComments: [], totals: { recipes: 0, comments: 0, likes: 0 } } }),
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("clique no Receitando para morder")).toHaveCount(0);
    await testInfo.attach(`after-${size.name}.png`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
}

test("home usa estados vazios diretos", async ({ page }) => {
  await installApiMock(page, {
    "GET /api/home-feed": async () => ({ body: { popular: [], recentComments: [], totals: { recipes: 0, comments: 0, likes: 0 } } }),
  });
  await page.goto("/");
  await expect(page.getByText("Nenhuma receita disponível agora.")).toBeVisible();
  await expect(page.getByText("Ainda não há comentários.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver comentários →" })).toBeVisible();
});
