import { expect, test } from "@playwright/test";

import { installApiMock } from "./api-mock";

const sizes = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 1000 },
] as const;

async function attachProductionBaseline(page: import("@playwright/test").Page, testInfo: import("@playwright/test").TestInfo, name: string) {
  try {
    await page.goto("https://receitando.miguellpitaa.workers.dev/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await testInfo.attach(`before-${name}.png`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  } catch {
    await testInfo.attach(`before-${name}.txt`, { body: Buffer.from("Baseline de produção indisponível durante este run."), contentType: "text/plain" });
  }
}

for (const size of sizes) {
  test(`microcopy antes e depois — ${size.name}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await attachProductionBaseline(page, testInfo, size.name);

    await installApiMock(page, {
      "GET /api/home-feed": async () => ({ body: { popular: [], recentComments: [], totals: { recipes: 0, comments: 0, likes: 0 } } }),
    });
    await page.goto("http://127.0.0.1:3000/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("clique no Receitando para morder")).toHaveCount(0);
    await testInfo.attach(`after-${size.name}.png`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
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
