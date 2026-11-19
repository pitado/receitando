import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MatchRecipeResult } from "@/types/recipe";

import { HomeHero } from "./HomeHero";

vi.mock("@/services/pantry.service", () => ({
  getIngredients: vi.fn().mockResolvedValue([]),
}));

function match(
  id: string,
  missingCount: number,
  status: "READY" | "PARTIAL",
): MatchRecipeResult {
  return {
    id,
    title: "Pão de queijo caseiro",
    status,
    missingIngredients:
      missingCount === 0 ? [] : [{ id: "polvilho", name: "polvilho doce" }],
  } as unknown as MatchRecipeResult;
}

describe("HomeHero — pontuação e resumo", () => {
  it("mantém a vírgula junto do último ingrediente e separa o resumo", () => {
    render(
      <HomeHero
        ingredients={["leite", "sal"]}
        matches={[match("receita-1", 1, "PARTIAL")]}
        matchState="ready"
        onAddIngredient={vi.fn()}
        onRemoveIngredient={vi.fn()}
      />,
    );

    const lastIngredient = screen.getByRole("button", { name: "Remover sal" });
    expect(lastIngredient.parentElement).toHaveTextContent(/sal×,$/);
    expect(
      screen.getByText("Falta 1 ingrediente · 1 combinação encontrada"),
    ).toBeInTheDocument();
  });

  it("distingue quantidade de receitas da quantidade de ingredientes faltantes", () => {
    render(
      <HomeHero
        ingredients={["leite", "sal"]}
        matches={[
          match("receita-1", 0, "READY"),
          match("receita-2", 1, "PARTIAL"),
          match("receita-3", 1, "PARTIAL"),
        ]}
        matchState="ready"
        onAddIngredient={vi.fn()}
        onRemoveIngredient={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "1 receita pronta pra fazer · 2 receitas a 1 ingrediente de distância · 3 combinações encontradas",
      ),
    ).toBeInTheDocument();
  });
});
