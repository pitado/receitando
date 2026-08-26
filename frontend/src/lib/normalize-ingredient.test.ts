import { describe, expect, it } from "vitest";

import { normalizeIngredientName } from "./normalize-ingredient";

describe("normalizeIngredientName", () => {
  it("remove acentos e normaliza caixa", () => {
    expect(normalizeIngredientName("AÇÚCAR")).toBe("acucar");
  });

  it("remove espaços excedentes", () => {
    expect(normalizeIngredientName("  Farinha   de   Trigo  ")).toBe("farinha de trigo");
  });

  it("preserva palavras em português de forma previsível", () => {
    expect(normalizeIngredientName("Pão francês")).toBe("pao frances");
  });
});
