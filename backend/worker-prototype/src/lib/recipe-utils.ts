export type MatchStatus = "READY" | "ALMOST_READY" | "NEAR" | "EXPLORE";

const IRREGULAR_SINGULARS = new Map<string, string>([
  ["ovos", "ovo"],
  ["cebolas", "cebola"],
  ["tomates", "tomate"],
  ["batatas", "batata"],
  ["cenouras", "cenoura"],
  ["bananas", "banana"],
  ["macas", "maca"],
  ["laranjas", "laranja"],
  ["limoes", "limao"],
  ["pimentas", "pimenta"],
]);

const PREPARATION_SUFFIXES = [
  /\s+(?:picad[oa]s?|cortad[oa]s?|ralad[oa]s?|fatiad[oa]s?|amassad[oa]s?|cozid[oa]s?|descascad[oa]s?)$/,
  /\s+(?:pequen[oa]s?|medi[oa]s?|grandes?)$/,
  /\s+(?:em\s+)?(?:cubos?|rodelas?|fatias?|pedacos?)$/,
  /\s+a\s+gosto$/,
];

export function normalizeIngredient(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/[^a-z0-9()\s/.,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularizeHead(value: string): string {
  const [head, ...tail] = value.split(" ");
  if (!head) return value;

  const irregular = IRREGULAR_SINGULARS.get(head);
  if (irregular) return [irregular, ...tail].join(" ");

  if (head.length > 4 && head.endsWith("oes")) {
    return [`${head.slice(0, -3)}ao`, ...tail].join(" ");
  }
  if (head.length > 4 && head.endsWith("ais")) {
    return [`${head.slice(0, -3)}al`, ...tail].join(" ");
  }
  if (head.length > 4 && head.endsWith("eis")) {
    return [`${head.slice(0, -3)}el`, ...tail].join(" ");
  }
  if (head.length > 4 && /[aeiou]s$/.test(head)) {
    return [head.slice(0, -1), ...tail].join(" ");
  }

  return value;
}

export function canonicalIngredientName(value: string): string {
  let normalized = normalizeIngredient(value)
    .replace(/\([^)]*\)/g, " ")
    .replace(
      /^\s*(?:\d+(?:[.,]\d+)?(?:\s+e\s+\d+\/\d+)?|\d+\/\d+|uma?|duas?|meia?)\s+/,
      "",
    )
    .replace(
      /^\s*(?:kg|g|gramas?|quilogramas?|litros?|ml|mililitros?|xicaras?|chavenas?|copos?|colheres?|latas?|pacotes?|vidros?|dentes?|unidades?|tabletes?|envelopes?|pitadas?)\s+(?:de\s+)?/,
      "",
    )
    .replace(/^\s*de\s+/, "")
    .replace(/[;,.]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

  let changed = true;
  while (changed && normalized) {
    const before = normalized;
    for (const suffix of PREPARATION_SUFFIXES) normalized = normalized.replace(suffix, "").trim();
    changed = normalized !== before;
  }

  return singularizeHead(normalized || normalizeIngredient(value));
}

export function ingredientLookupCandidates(value: string): string[] {
  const normalized = normalizeIngredient(value);
  const canonical = canonicalIngredientName(value);
  return [...new Set([normalized, canonical].filter(Boolean))];
}

export function compatibilityPercent(foundCount: number, requiredCount: number): number {
  if (!Number.isFinite(foundCount) || !Number.isFinite(requiredCount) || requiredCount <= 0) return 0;
  const value = Math.round((foundCount / requiredCount) * 100);
  return Math.max(0, Math.min(100, value));
}

export function matchStatus(compatibility: number): MatchStatus {
  if (compatibility >= 100) return "READY";
  if (compatibility >= 70) return "ALMOST_READY";
  if (compatibility >= 40) return "NEAR";
  return "EXPLORE";
}
