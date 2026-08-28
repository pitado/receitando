import { canonicalIngredientName, normalizeIngredient } from "./recipe-utils";

export type AdaptationConfidence = "HIGH" | "MEDIUM" | "LOW";

export type AdaptableIngredient = {
  ingredientId: string;
  name: string;
  normalizedName?: string;
  category?: string;
  quantity: number | null;
  unit: string | null;
  optional?: boolean;
  isStaple?: boolean;
  rawText?: string | null;
};

export type RecipeAdaptationInput = {
  recipeTitle: string;
  currentServings: number;
  targetServings?: number;
  unavailableIngredients?: string[];
  ingredients: AdaptableIngredient[];
};

type SubstitutionOption = {
  name: string;
  ratio: number;
  confidence: AdaptationConfidence;
  reason: string;
};

type SubstitutionRule = {
  aliases: string[];
  alternatives: SubstitutionOption[];
};

export type AdaptedIngredient = {
  ingredientId: string;
  originalName: string;
  adaptedName: string;
  optional: boolean;
  unavailable: boolean;
  original: {
    quantity: number | null;
    unit: string | null;
    rawText: string | null;
  };
  adapted: {
    quantity: number | null;
    unit: string | null;
    displayAmount: string | null;
  };
  substitution: {
    recommended: SubstitutionOption;
    alternatives: SubstitutionOption[];
  } | null;
  warnings: string[];
};

export type RecipeAdaptationResult = {
  engineVersion: "1.0";
  recipeTitle: string;
  originalServings: number | null;
  targetServings: number | null;
  scaleFactor: number;
  confidence: number;
  ingredients: AdaptedIngredient[];
  changes: Array<{
    type: "SCALE" | "SUBSTITUTION";
    ingredientId?: string;
    message: string;
  }>;
  warnings: string[];
};

const SUBSTITUTION_RULES: SubstitutionRule[] = [
  {
    aliases: ["leite", "leite integral", "leite de vaca"],
    alternatives: [
      {
        name: "leite sem lactose",
        ratio: 1,
        confidence: "HIGH",
        reason: "Mantém volume, gordura e comportamento muito próximos do leite comum.",
      },
      {
        name: "bebida vegetal sem açúcar",
        ratio: 1,
        confidence: "MEDIUM",
        reason: "Mantém o volume, mas pode alterar levemente sabor, gordura e textura.",
      },
    ],
  },
  {
    aliases: ["manteiga", "manteiga sem sal", "manteiga com sal"],
    alternatives: [
      {
        name: "margarina culinária",
        ratio: 1,
        confidence: "HIGH",
        reason: "Substituição direta na maioria de massas, refogados e preparos assados.",
      },
      {
        name: "óleo vegetal",
        ratio: 0.8,
        confidence: "MEDIUM",
        reason: "Funciona em muitos preparos, mas muda textura e teor de água.",
      },
    ],
  },
  {
    aliases: ["acucar", "acucar refinado", "acucar cristal", "acucar branco"],
    alternatives: [
      {
        name: "açúcar demerara",
        ratio: 1,
        confidence: "HIGH",
        reason: "Pode ser usado na mesma proporção na maior parte das receitas.",
      },
      {
        name: "açúcar mascavo",
        ratio: 1,
        confidence: "MEDIUM",
        reason: "Mantém o poder adoçante aproximado, mas adiciona umidade e sabor de melaço.",
      },
    ],
  },
  {
    aliases: ["farinha de trigo", "farinha trigo"],
    alternatives: [
      {
        name: "mistura de farinha sem glúten 1:1",
        ratio: 1,
        confidence: "MEDIUM",
        reason: "Misturas formuladas para troca 1:1 são mais previsíveis que farinhas isoladas.",
      },
    ],
  },
  {
    aliases: ["creme de leite"],
    alternatives: [
      {
        name: "creme culinário vegetal",
        ratio: 1,
        confidence: "HIGH",
        reason: "Mantém volume e cremosidade de forma próxima em molhos e recheios.",
      },
      {
        name: "leite de coco",
        ratio: 1,
        confidence: "MEDIUM",
        reason: "Mantém cremosidade, porém adiciona sabor característico.",
      },
    ],
  },
  {
    aliases: ["tomate", "tomate maduro"],
    alternatives: [
      {
        name: "tomate pelado",
        ratio: 1,
        confidence: "HIGH",
        reason: "É uma troca próxima para molhos, cozidos e recheios.",
      },
    ],
  },
  {
    aliases: ["cebola", "cebola branca", "cebola amarela"],
    alternatives: [
      {
        name: "alho-poró",
        ratio: 1,
        confidence: "MEDIUM",
        reason: "Entrega base aromática semelhante, embora com sabor mais suave.",
      },
    ],
  },
  {
    aliases: ["ovo", "ovos"],
    alternatives: [
      {
        name: "ovo de linhaça",
        ratio: 1,
        confidence: "LOW",
        reason: "Pode ligar algumas massas, mas não reproduz aeração, emulsão e estrutura do ovo em todos os preparos.",
      },
    ],
  },
];

const UNIT_ALIASES: Array<[RegExp, string]> = [
  [/^(?:colheres?\s+de\s+sopa|c\.\s*sopa)\b/i, "colher (sopa)"],
  [/^(?:colheres?\s+de\s+cha|c\.\s*cha)\b/i, "colher (chá)"],
  [/^(?:xicaras?|xícara?s?)\b/i, "xícara"],
  [/^(?:quilogramas?|quilos?|kg)\b/i, "kg"],
  [/^(?:gramas?|g)\b/i, "g"],
  [/^(?:mililitros?|ml)\b/i, "ml"],
  [/^(?:litros?|l)\b/i, "l"],
  [/^(?:unidades?|un)\b/i, "unidade"],
  [/^(?:dentes?)\b/i, "dente"],
  [/^(?:latas?)\b/i, "lata"],
  [/^(?:pacotes?)\b/i, "pacote"],
  [/^(?:pitadas?)\b/i, "pitada"],
];

const FRACTION_GLYPHS: Record<string, string> = {
  "½": "1/2",
  "¼": "1/4",
  "¾": "3/4",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};

const SENSITIVE_INGREDIENTS = [
  "fermento",
  "bicarbonato",
  "sal",
  "pimenta",
  "ovo",
  "gelatina",
];

function replaceFractionGlyphs(value: string): string {
  return value.replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, (glyph) => ` ${FRACTION_GLYPHS[glyph]} `);
}

function parseFraction(value: string): number | null {
  const [numerator, denominator] = value.split("/").map(Number);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

function parseNumericExpression(value: string): number | null {
  const cleaned = value.trim().replace(",", ".");
  if (!cleaned) return null;

  const mixed = cleaned.match(/^(\d+(?:\.\d+)?)\s+(\d+\/\d+)$/);
  if (mixed) {
    const whole = Number(mixed[1]);
    const fraction = parseFraction(mixed[2]);
    return fraction === null ? null : whole + fraction;
  }

  if (/^\d+\/\d+$/.test(cleaned)) return parseFraction(cleaned);
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

export function parseIngredientAmount(rawText: string | null | undefined): {
  quantity: number | null;
  unit: string | null;
} {
  if (!rawText?.trim()) return { quantity: null, unit: null };

  const prepared = replaceFractionGlyphs(rawText).trim();
  const amountMatch = prepared.match(/^(\d+(?:[.,]\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\b/);
  if (!amountMatch) return { quantity: null, unit: null };

  const quantity = parseNumericExpression(amountMatch[1]);
  if (quantity === null) return { quantity: null, unit: null };

  const remainder = normalizeIngredient(prepared.slice(amountMatch[0].length)).replace(/^de\s+/, "");
  const unit = UNIT_ALIASES.find(([pattern]) => pattern.test(remainder))?.[1] ?? null;
  return { quantity, unit };
}

function kitchenRound(value: number): number {
  if (!Number.isFinite(value)) return value;
  if (Math.abs(value) >= 10) return Math.round(value * 10) / 10;
  return Math.round(value * 100) / 100;
}

function formatKitchenNumber(value: number): string {
  const rounded = kitchenRound(value);
  const whole = Math.floor(rounded);
  const fraction = rounded - whole;
  const commonFractions: Array<[number, string]> = [
    [0.25, "¼"],
    [1 / 3, "⅓"],
    [0.5, "½"],
    [2 / 3, "⅔"],
    [0.75, "¾"],
  ];
  const nearest = commonFractions.find(([candidate]) => Math.abs(fraction - candidate) <= 0.035);

  if (nearest) return `${whole > 0 ? `${whole} ` : ""}${nearest[1]}`;
  if (Math.abs(fraction) <= 0.035) return String(whole);
  return String(rounded).replace(".", ",");
}

function formatAmount(quantity: number | null, unit: string | null): string | null {
  if (quantity === null) return null;
  return `${formatKitchenNumber(quantity)}${unit ? ` ${unit}` : ""}`;
}

function confidenceValue(confidence: AdaptationConfidence): number {
  if (confidence === "HIGH") return 92;
  if (confidence === "MEDIUM") return 76;
  return 52;
}

function canonicalAliases(values: string[]): string[] {
  return values.map((value) => canonicalIngredientName(value));
}

function substitutionFor(name: string): SubstitutionRule | null {
  const canonical = canonicalIngredientName(name);
  return SUBSTITUTION_RULES.find((rule) => canonicalAliases(rule.aliases).includes(canonical)) ?? null;
}

function unavailableSet(values: string[]): Set<string> {
  return new Set(
    values.flatMap((value) => [normalizeIngredient(value), canonicalIngredientName(value)]).filter(Boolean),
  );
}

function isUnavailableIngredient(ingredient: AdaptableIngredient, unavailable: Set<string>): boolean {
  const candidates = [
    ingredient.normalizedName ? normalizeIngredient(ingredient.normalizedName) : "",
    normalizeIngredient(ingredient.name),
    canonicalIngredientName(ingredient.name),
  ];
  return candidates.some((value) => value && unavailable.has(value));
}

function sensitiveScalingWarning(name: string, factor: number): string | null {
  if (factor >= 0.75 && factor <= 1.5) return null;
  const canonical = canonicalIngredientName(name);
  const sensitive = SENSITIVE_INGREDIENTS.find((item) => canonical === item || canonical.startsWith(`${item} `));
  if (!sensitive) return null;
  return `A quantidade de ${name} merece conferência manual ao alterar muito o rendimento.`;
}

function resolvedIngredientAmount(ingredient: AdaptableIngredient): { quantity: number | null; unit: string | null } {
  if (ingredient.quantity !== null && Number.isFinite(ingredient.quantity)) {
    return { quantity: ingredient.quantity, unit: ingredient.unit };
  }
  const parsed = parseIngredientAmount(ingredient.rawText);
  return {
    quantity: parsed.quantity,
    unit: ingredient.unit ?? parsed.unit,
  };
}

export function adaptRecipe(input: RecipeAdaptationInput): RecipeAdaptationResult {
  const currentServings = Number.isFinite(input.currentServings) && input.currentServings > 0
    ? Math.round(input.currentServings)
    : 0;
  const requestedTarget = Number.isFinite(input.targetServings) && (input.targetServings ?? 0) > 0
    ? Math.round(input.targetServings as number)
    : 0;
  const canScale = currentServings > 0 && requestedTarget > 0;
  const targetServings = canScale ? requestedTarget : currentServings || null;
  const scaleFactor = canScale ? requestedTarget / currentServings : 1;
  const unavailable = unavailableSet(input.unavailableIngredients ?? []);
  const warnings: string[] = [];
  const changes: RecipeAdaptationResult["changes"] = [];
  const confidenceScores: number[] = [];

  if (canScale && Math.abs(scaleFactor - 1) > 0.001) {
    changes.push({
      type: "SCALE",
      message: `Quantidades recalculadas de ${currentServings} para ${requestedTarget} porções.`,
    });
  } else if (requestedTarget > 0 && currentServings === 0) {
    warnings.push("O rendimento original não está informado; as quantidades foram mantidas sem escala.");
  }

  const ingredients = input.ingredients.map<AdaptedIngredient>((ingredient) => {
    const amount = resolvedIngredientAmount(ingredient);
    const unavailableIngredient = isUnavailableIngredient(ingredient, unavailable);
    const rule = unavailableIngredient ? substitutionFor(ingredient.name) : null;
    const recommended = rule?.alternatives[0] ?? null;
    const ratio = recommended?.ratio ?? 1;
    const scaledQuantity = amount.quantity === null
      ? null
      : kitchenRound(amount.quantity * scaleFactor * ratio);
    const ingredientWarnings: string[] = [];

    const scalingWarning = sensitiveScalingWarning(ingredient.name, scaleFactor);
    if (scalingWarning) ingredientWarnings.push(scalingWarning);

    if (unavailableIngredient && recommended) {
      confidenceScores.push(confidenceValue(recommended.confidence));
      changes.push({
        type: "SUBSTITUTION",
        ingredientId: ingredient.ingredientId,
        message: `${ingredient.name} → ${recommended.name} (${recommended.confidence.toLowerCase()}).`,
      });
    } else if (unavailableIngredient) {
      confidenceScores.push(35);
      ingredientWarnings.push(`Ainda não há uma substituição confiável cadastrada para ${ingredient.name}.`);
    } else {
      confidenceScores.push(100);
    }

    return {
      ingredientId: ingredient.ingredientId,
      originalName: ingredient.name,
      adaptedName: recommended?.name ?? ingredient.name,
      optional: Boolean(ingredient.optional),
      unavailable: unavailableIngredient,
      original: {
        quantity: amount.quantity,
        unit: amount.unit,
        rawText: ingredient.rawText ?? null,
      },
      adapted: {
        quantity: scaledQuantity,
        unit: amount.unit,
        displayAmount: formatAmount(scaledQuantity, amount.unit),
      },
      substitution: recommended
        ? {
            recommended,
            alternatives: rule?.alternatives.slice(1) ?? [],
          }
        : null,
      warnings: ingredientWarnings,
    };
  });

  const uniqueWarnings = [...new Set([
    ...warnings,
    ...ingredients.flatMap((ingredient) => ingredient.warnings),
  ])];
  const baseConfidence = confidenceScores.length
    ? Math.round(confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length)
    : 100;
  const scalingPenalty = uniqueWarnings.some((warning) => warning.includes("conferência manual")) ? 5 : 0;

  return {
    engineVersion: "1.0",
    recipeTitle: input.recipeTitle,
    originalServings: currentServings || null,
    targetServings,
    scaleFactor: kitchenRound(scaleFactor),
    confidence: Math.max(0, Math.min(100, baseConfidence - scalingPenalty)),
    ingredients,
    changes,
    warnings: uniqueWarnings,
  };
}
