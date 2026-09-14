import { expect, test } from "@playwright/test";

import { installApiMock } from "./api-mock";

const sizes = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 1000 },
] as const;

const homeFeed = {
  popular: [],
  recentComments: [],
  totals: { recipes: 12, comments: 3, likes: 8 },
};

async function attachProductionBaseline(page: import("@playwright/test").Page, testInfo: import("@playwright/test").TestInfo, name: string) {
  try {
    await page.goto("https://receitando.miguellpitaa.workers.dev/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await testInfo.attach(`before-${name}.png`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  } catch {
    await testInfo.attach(`before-${name}.txt`, { body: Buffer.from("Baseline de produção indisponível durante este run."), contentType: "text/plain" });
  }
}

for (const size of sizes) {
  test(`header UX antes e depois — ${size.name}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await attachProductionBaseline(page, testInfo, size.name);

    await installApiMock(page, {
      "GET /api/home-feed": async () => ({ body: homeFeed }),
      "GET /api/pantry": async () => ({ status: 401, body: { message: "Não autenticado" } }),
    });
    await page.goto("http://127.0.0.1:3000/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await testInfo.attach(`after-${size.name}.png`, { body: await page.screenshot({ fullPage: true }), contentType: "image/png" });
  });
}

test("mobile usa bottom nav com quatro destinos", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await installApiMock(page, {
    "GET /api/home-feed": async () => ({ body: homeFeed }),
    "GET /api/pantry": async () => ({ status: 401, body: { message: "Não autenticado" } }),
  });
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "Navegação móvel" });
  await expect(nav.getByRole("link")).toHaveCount(4);
  await expect(nav.getByRole("link", { name: "Receitas" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Favoritos" })).toBeVisible();
});

test("busca global abre por Ctrl+K e separa receitas de ingredientes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await installApiMock(page, {
    "GET /api/home-feed": async () => ({ body: homeFeed }),
    "GET /api/pantry": async () => ({ status: 401, body: { message: "Não autenticado" } }),
    "GET /api/ingredients": async () => ({ body: [{ id: "banana", name: "Banana", normalizedName: "banana", category: "Frutas" }] }),
    "GET /api/v2/recipes": async () => ({
      body: {
        items: [{ id: "bolo-banana", slug: "bolo-de-banana", title: "Bolo de banana", description: "Bolo simples", imageUrl: null, prepMinutes: 35, servings: 8, difficulty: "FACIL", mealType: "Sobremesa", source: { name: "Comunidade", externalSource: null } }],
        pagination: { total: 1, limit: 5, offset: 0, hasMore: false },
        filters: { query: "banana", source: "", mealType: "", difficulty: "", maxPrepMinutes: null, sort: "relevance" },
      },
    }),
  });
  await page.goto("/");

  await page.keyboard.press("Control+K");
  const input = page.getByRole("searchbox", { name: "Buscar receitas ou ingredientes" });
  await expect(input).toBeFocused();
  await input.fill("banana");

  await expect(page.getByRole("heading", { name: "Receitas" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Bolo de banana/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Despensa" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Adicionar" })).toBeVisible();
});
