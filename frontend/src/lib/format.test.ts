import { describe, expect, it } from "vitest";

import { formatIngredientAmount, formatPrepTime } from "./format";

describe("formatPrepTime", () => {
  it("formata minutos abaixo de uma hora", () => {
    expect(formatPrepTime(35)).toBe("35 min");
  });

  it("formata horas inteiras", () => {
    expect(formatPrepTime(120)).toBe("2 h");
  });

  it("formata horas com minutos restantes", () => {
    expect(formatPrepTime(95)).toBe("1 h 35 min");
  });
});

describe("formatIngredientAmount", () => {
  it("combina quantidade e unidade", () => {
    expect(formatIngredientAmount(2, "xícaras")).toBe("2 xícaras");
  });

  it("aceita quantidade textual", () => {
    expect(formatIngredientAmount("1/2", "colher")).toBe("1/2 colher");
  });

  it("remove partes vazias", () => {
    expect(formatIngredientAmount(null, "a gosto")).toBe("a gosto");
    expect(formatIngredientAmount(3, null)).toBe("3");
  });
});
