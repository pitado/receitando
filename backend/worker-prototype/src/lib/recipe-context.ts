import { canonicalIngredientName, normalizeIngredient } from "./recipe-utils";
import type { RecipeAdaptationResult } from "./recipe-adaptation";

export type CulinarySignal =
  | "BAKED"
  | "FRIED"
  | "COOKED"
  | "FRESH"
  | "AERATED"
  | "EGG_CENTRIC"
  | "SWEET"
  | "SAVORY";

export type RecipeCulinaryContext = {
  signals: CulinarySignal[];
  evidence: string[];
};

type RecipeContextInput = {
  title: string;
  mealType?: string | null;
  instructions?: string | null;
  tags?: string[];
};

type ContextDecision = {
  allowed: boolean;
  penalty: number;
  warning: string | null;
};

function normalizedCorpus(input: RecipeContextInput): string {
  return normalizeIngredient([
    input.title,
    input.mealType ?? "",
    input.instructions ?? "",
    ...(input.tags ?? []),
  ].join(" "));
}

function hasAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

export function inferRecipeContext(input: RecipeContextInput): RecipeCulinaryContext {
  const corpus = normalizedCorpus(input);
  const title = normalizeIngredient(input.title);
  const signals = new Set<CulinarySignal>();
  const evidence: string[] = [];

  if (hasAny(corpus, [/\bforno\b/, /\bassar\b/, /\bassad[oa]\b/, /\bbolo\b/, /\bbiscoit/, /\bpao\b/, /\btorta\b/])) {
    signals.add("BAKED");
    evidence.push("preparo assado");
  }
  if (hasAny(corpus, [/\bfrit/, /\boleo quente\b/, /\bfrigideira\b/])) {
    signals.add("FRIED");
    evidence.push("preparo frito ou em frigideira");
  }
  if (hasAny(corpus, [/\bcoz/, /\bferv/, /\bpanela\b/, /\bmolho\b/, /\brefog/])) {
    signals.add("COOKED");
    evidence.push("preparo cozido");
  }
  if (hasAny(corpus, [/\bsalada\b/, /\bcru[ao]\b/, /\bnao cozinhar\b/, /\bgelad[ao]\b/])) {
    signals.add("FRESH");
    evidence.push("preparo fresco ou sem cocção");
  }
  if (hasAny(corpus, [/\bmerengue\b/, /\bsuspiro\b/, /\bclaras? em neve\b/, /\bbater as claras\b/])) {
    signals.add("AERATED");
    evidence.push("estrutura depende de aeração");
  }
  if (hasAny(title, [/\bovo\b/, /\bovos\b/, /\bomelete\b/, /\bovos mexidos\b/, /\bfrittata\b/])) {
    signals.add("EGG_CENTRIC");
    evidence.push("ovo é elemento central da receita");
  }
  if (hasAny(corpus, [/\bdoce\b/, /\bsobremesa\b/, /\bacucar\b/, /\bchocolate\b/, /\bbrigadeiro\b/, /\bbolo\b/])) {
    signals.add("SWEET");
    evidence.push("perfil doce");
  }
  if (hasAny(corpus, [/\bsal\b/, /\bcebola\b/, /\balho\b/, /\bcarne\b/, /\bfrango\b/, /\bpeixe\b/, /\bmolho\b/, /\bsalada\b/])) {
    signals.add("SAVORY");
    evidence.push("perfil salgado");
  }

  return { signals: [...signals], evidence: [...new Set(evidence)] };
}

function contextualDecision(
  originalName: string,
  replacementName: string,
  context: RecipeCulinaryContext,
): ContextDecision {
  const original = canonicalIngredientName(originalName);
  const replacement = canonicalIngredientName(replacementName);
  const signals = new Set(context.signals);

  if (original === "ovo" && replacement.includes("linhaca")) {
    if (signals.has("EGG_CENTRIC")) {
      return {
        allowed: false,
        penalty: 0,
        warning: "O ovo é estrutural nesta receita; ovo de linhaça não é uma troca equivalente.",
      };
    }
    if (signals.has("AERATED")) {
      return {
        allowed: false,
        penalty: 0,
        warning: "A receita depende de aeração com ovos; a substituição por linhaça foi bloqueada.",
      };
    }
    if (!signals.has("BAKED")) {
      return {
        allowed: true,
        penalty: 12,
        warning: "A troca de ovo por linhaça é mais previsível em massas assadas do que neste tipo de preparo.",
      };
    }
  }

  if (original === "tomate" && replacement.includes("tomate pelado") && signals.has("FRESH")) {
    return {
      allowed: false,
      penalty: 0,
      warning: "Tomate pelado não substitui bem tomate fresco em preparos crus ou saladas.",
    };
  }

  if (original === "cebola" && replacement.includes("alho poro") && signals.has("SWEET") && !signals.has("SAVORY")) {
    return {
      allowed: false,
      penalty: 0,
      warning: "A troca aromática de cebola por alho-poró não combina com o contexto doce identificado.",
    };
  }

  if (original.includes("farinha de trigo") && replacement.includes("sem gluten") && !signals.has("BAKED")) {
    return {
      allowed: true,
      penalty: 8,
      warning: "Misturas sem glúten 1:1 são mais previsíveis em massas assadas; confira a textura neste preparo.",
    };
  }

  if (original === "leite" && replacement.includes("bebida vegetal") && signals.has("SAVORY") && !signals.has("SWEET")) {
    return {
      allowed: true,
      penalty: 8,
      warning: "Em preparos salgados, prefira bebida vegetal neutra e sem açúcar para evitar alterar o sabor.",
    };
  }

  return { allowed: true, penalty: 0, warning: null };
}

export function contextualizeAdaptation(
  result: RecipeAdaptationResult,
  context: RecipeCulinaryContext,
): RecipeAdaptationResult & { culinaryContext: RecipeCulinaryContext } {
  let confidencePenalty = 0;
  const blockedIngredientIds = new Set<string>();

  const ingredients = result.ingredients.map((ingredient) => {
    if (!ingredient.substitution) return ingredient;

    const decision = contextualDecision(
      ingredient.originalName,
      ingredient.substitution.recommended.name,
      context,
    );

    if (!decision.allowed) {
      blockedIngredientIds.add(ingredient.ingredientId);
      confidencePenalty += 18;
      return {
        ...ingredient,
        adaptedName: ingredient.originalName,
        substitution: null,
        warnings: [...new Set([
          ...ingredient.warnings,
          decision.warning ?? "Substituição bloqueada pelo contexto culinário.",
        ])],
      };
    }

    if (decision.penalty > 0) confidencePenalty += decision.penalty;
    return {
      ...ingredient,
      warnings: decision.warning
        ? [...new Set([...ingredient.warnings, decision.warning])]
        : ingredient.warnings,
    };
  });

  const warnings = [...new Set([
    ...result.warnings,
    ...ingredients.flatMap((ingredient) => ingredient.warnings),
  ])];
  const changes = result.changes.filter(
    (change) => change.type !== "SUBSTITUTION" || !change.ingredientId || !blockedIngredientIds.has(change.ingredientId),
  );

  return {
    ...result,
    confidence: Math.max(0, result.confidence - Math.min(30, confidencePenalty)),
    ingredients,
    changes,
    warnings,
    culinaryContext: context,
  };
}
