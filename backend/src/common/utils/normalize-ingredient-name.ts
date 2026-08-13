/**
 * Produces the canonical representation used to compare ingredient names.
 * It intentionally does not attempt to infer synonyms or quantities.
 */
export function normalizeIngredientName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ');
}
