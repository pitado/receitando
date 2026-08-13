import { Inject, Injectable } from '@nestjs/common';

import { normalizeIngredientName } from '../../common/utils/normalize-ingredient-name';
import { MatchingRepository } from './matching.repository';
import type {
  MatchRecipeResult,
  MatchingRecipe,
  MatchingRecipesReader,
} from './matching.types';

@Injectable()
export class MatchingService {
  constructor(
    @Inject(MatchingRepository)
    private readonly matchingRepository: MatchingRecipesReader,
  ) {}

  async match(ingredients: string[]): Promise<MatchRecipeResult[]> {
    const availableIngredients = new Set(
      ingredients.map(normalizeIngredientName).filter((ingredient) => ingredient.length > 0),
    );
    const recipes = await this.matchingRepository.findAll();
    const results = recipes.map((recipe) => this.calculate(recipe, availableIngredients));

    return results.sort(
      (first, second) =>
        second.compatibility - first.compatibility ||
        first.title.localeCompare(second.title, 'pt-BR'),
    );
  }

  private calculate(
    recipe: MatchingRecipe,
    availableIngredients: ReadonlySet<string>,
  ): MatchRecipeResult {
    const requiredIngredients = recipe.ingredients
      .filter((item) => !item.optional)
      .map((item) => item.ingredient.normalizedName);
    const foundIngredients = requiredIngredients.filter((ingredient) =>
      availableIngredients.has(ingredient),
    );
    const missingIngredients = requiredIngredients.filter(
      (ingredient) => !availableIngredients.has(ingredient),
    );
    const compatibility =
      requiredIngredients.length === 0
        ? 100
        : Math.round((foundIngredients.length / requiredIngredients.length) * 100);

    return {
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      prepMinutes: recipe.prepMinutes,
      servings: recipe.servings,
      compatibility,
      requiredIngredients,
      foundIngredients,
      missingIngredients,
    };
  }
}
