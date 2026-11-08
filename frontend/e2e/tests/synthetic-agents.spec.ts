import { expect, test } from "@playwright/test";
import { installApiMock } from "./api-mock";

/**
 * 50 deterministic synthetic journeys. These are browser tests, NOT MiroFish
 * agents or evidence of real human behavior.
 * Run pilot: AGENT_PILOT=1 npx playwright test synthetic-agents.spec.ts
 * Run all:   npx playwright test synthetic-agents.spec.ts --workers=2
 */
const personas = [
  ...Array.from({ length: 15 }, (_, i) => ({ group: "iniciante", i, route: "/" })),
  ...Array.from({ length: 10 }, (_, i) => ({ group: "frequente", i, route: "/combinar" })),
  ...Array.from({ length: 10 }, (_, i) => ({ group: "economico", i, route: "/" })),
  ...Array.from({ length: 10 }, (_, i) => ({ group: "mobile", i, route: "/despensa" })),
  ...Array.from({ length: 5 }, (_, i) => ({ group: "avancado", i, route: "/combinar" })),
];
const selected = process.env.AGENT_PILOT === "1" ? personas.slice(0, 5) : personas;

test.describe("50 jornadas sinteticas isoladas", () => {
  for (const [index, persona] of selected.entries()) {
    test(`agente ${String(index + 1).padStart(2, "0")} - ${persona.group}`, async ({ page }) => {
      if (persona.group === "mobile") {
        await page.setViewportSize({ width: 390, height: 844 });
      }
      await installApiMock(page, {
        "GET /api/home-feed": async () => ({
          body: { popular: [], recentComments: [], totals: { recipes: 12, comments: 3, likes: 8 } },
        }),
      });
      await page.goto(persona.route);
      if (persona.route === "/") {
        await expect(page.getByRole("heading", { level: 1, name: "Cozinhe com o que você já tem." })).toBeVisible();
        const ingredient = persona.group === "economico" ? "arroz" : "tomate";
        await page.getByRole("button", { name: ingredient, exact: true }).click();
        await expect(page.getByLabel("Ingredientes que você tem")).toHaveValue(ingredient);
        await page.getByRole("button", { name: "Buscar receitas" }).click();
        await expect(page).toHaveURL(/\/combinar\?/);
      } else if (persona.route === "/combinar") {
        await expect(page.getByLabel("Adicione um ingrediente")).toBeVisible();
        await page.getByLabel("Adicione um ingrediente").fill("ovo");
        await page.getByRole("button", { name: "Adicionar" }).click();
        await expect(page.getByText("1 adicionado")).toBeVisible();
      } else {
        await expect(page.getByRole("link", { name: "Entrar na minha conta" }))
          .toHaveAttribute("href", "/entrar?next=/despensa");
      }
    });
  }
});
