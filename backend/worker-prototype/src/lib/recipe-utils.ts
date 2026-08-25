export type MatchStatus = "READY" | "ALMOST_READY" | "NEAR" | "EXPLORE";

export function normalizeIngredient(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ");
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
