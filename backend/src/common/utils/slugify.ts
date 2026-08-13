import { normalizeIngredientName } from './normalize-ingredient-name';

export function slugify(value: string): string {
  return normalizeIngredientName(value)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
