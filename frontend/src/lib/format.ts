export function formatPrepTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes === 0
    ? `${hours} h`
    : `${hours} h ${remainingMinutes} min`;
}

export function formatIngredientAmount(
  quantity: number | string | null,
  unit: string | null,
): string {
  return [quantity, unit]
    .filter((part): part is number | string => part !== null && part !== "")
    .join(" ");
}
