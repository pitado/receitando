export type KitchenDimension = "MASS" | "VOLUME" | "COUNT";

export type KitchenAmountComparison = {
  status: "ENOUGH" | "SHORT" | "UNKNOWN";
  dimension: KitchenDimension | null;
  requiredBase: number | null;
  availableBase: number | null;
  shortageBase: number | null;
};

type UnitDefinition = {
  canonical: string;
  dimension: KitchenDimension;
  factor: number;
};

const UNIT_DEFINITIONS: Array<{ pattern: RegExp; definition: UnitDefinition }> = [
  { pattern: /^(?:kg|quilo|quilos|quilograma|quilogramas)$/i, definition: { canonical: "kg", dimension: "MASS", factor: 1000 } },
  { pattern: /^(?:g|grama|gramas)$/i, definition: { canonical: "g", dimension: "MASS", factor: 1 } },
  { pattern: /^(?:l|litro|litros)$/i, definition: { canonical: "l", dimension: "VOLUME", factor: 1000 } },
  { pattern: /^(?:ml|mililitro|mililitros)$/i, definition: { canonical: "ml", dimension: "VOLUME", factor: 1 } },
  { pattern: /^(?:xicara|xicaras|xícara|xícaras)$/i, definition: { canonical: "xícara", dimension: "VOLUME", factor: 240 } },
  { pattern: /^(?:colher(?:es)?(?:\s*\(sopa\)|\s+de\s+sopa)?|c\.\s*sopa)$/i, definition: { canonical: "colher (sopa)", dimension: "VOLUME", factor: 15 } },
  { pattern: /^(?:colher(?:es)?\s*\(cha\)|colher(?:es)?\s+de\s+cha|colher(?:es)?\s+de\s+chá|c\.\s*cha|c\.\s*chá)$/i, definition: { canonical: "colher (chá)", dimension: "VOLUME", factor: 5 } },
  { pattern: /^(?:un|unidade|unidades)$/i, definition: { canonical: "unidade", dimension: "COUNT", factor: 1 } },
  { pattern: /^(?:dente|dentes)$/i, definition: { canonical: "dente", dimension: "COUNT", factor: 1 } },
];

function normalizeUnitText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function kitchenUnitDefinition(unit: string | null | undefined): UnitDefinition | null {
  if (!unit?.trim()) return null;
  const normalized = normalizeUnitText(unit);
  return UNIT_DEFINITIONS.find(({ pattern }) => pattern.test(normalized))?.definition ?? null;
}

export function compareKitchenAmounts(
  requiredQuantity: number | null,
  requiredUnit: string | null,
  availableQuantity: number | null,
  availableUnit: string | null,
): KitchenAmountComparison {
  if (
    requiredQuantity === null ||
    availableQuantity === null ||
    !Number.isFinite(requiredQuantity) ||
    !Number.isFinite(availableQuantity)
  ) {
    return {
      status: "UNKNOWN",
      dimension: null,
      requiredBase: null,
      availableBase: null,
      shortageBase: null,
    };
  }

  const required = kitchenUnitDefinition(requiredUnit);
  const available = kitchenUnitDefinition(availableUnit);
  if (!required || !available || required.dimension !== available.dimension) {
    return {
      status: "UNKNOWN",
      dimension: required?.dimension ?? available?.dimension ?? null,
      requiredBase: null,
      availableBase: null,
      shortageBase: null,
    };
  }

  const requiredBase = requiredQuantity * required.factor;
  const availableBase = availableQuantity * available.factor;
  const shortageBase = Math.max(0, requiredBase - availableBase);

  return {
    status: shortageBase > 0.0001 ? "SHORT" : "ENOUGH",
    dimension: required.dimension,
    requiredBase,
    availableBase,
    shortageBase,
  };
}

export function formatBaseKitchenAmount(value: number, dimension: KitchenDimension): string {
  if (dimension === "MASS") {
    if (value >= 1000) return `${formatNumber(value / 1000)} kg`;
    return `${formatNumber(value)} g`;
  }
  if (dimension === "VOLUME") {
    if (value >= 1000) return `${formatNumber(value / 1000)} l`;
    return `${formatNumber(value)} ml`;
  }
  return `${formatNumber(value)} unidade${Math.abs(value - 1) < 0.0001 ? "" : "s"}`;
}

function formatNumber(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded).replace(".", ",");
}
