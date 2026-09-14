import { expect, test } from "@playwright/test";

import { installApiMock } from "./api-mock";

const sizes = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 1000 },
] as const;

for (const size of sizes) {
  test(`interações UX — antes e depois — ${size.name}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    try {
      await page.goto("https://receitando.miguellpitaa.workers.dev/", { waitUntil: "domcontentloaded", timeout: 15000 });
      await testInfo.attach(`before-${size.name}.png`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
    } catch {
      await testInfo.attach(`before-${size.name}.txt`, { body: Buffer.from("Baseline de produção indisponível durante este run."), contentType: "text/plain" });
    }

    await installApiMock(page, {
      "GET /api/home-feed": async () => ({ body: { popular: [], recentComments: [], totals: { recipes: 12, comments: 3, likes: 8 } } }),
    });
    await page.goto("http://127.0.0.1:3000/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await testInfo.attach(`after-${size.name}.png`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });
}

test("manifesto PWA fica disponível", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBeTruthy();
  const manifest = await response.json();
  expect(manifest.name).toBe("Receitando");
  expect(manifest.display).toBe("standalone");
});
