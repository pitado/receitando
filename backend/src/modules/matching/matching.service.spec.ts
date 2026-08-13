import { normalizeIngredientName } from '../../common/utils/normalize-ingredient-name';
import { MatchingService } from './matching.service';
import type {
  MatchingRecipe,
  MatchingRecipeIngredient,
  MatchingRecipesReader,
} from './matching.types';

interface TestIngredient {
  name: string;
  optional?: boolean;
}

function makeRecipe(
  title: string,
  ingredients: TestIngredient[],
  id = title.toLocaleLowerCase('pt-BR').replace(/\s+/g, '-'),
): MatchingRecipe {
  const recipeIngredients: MatchingRecipeIngredient[] = ingredients.map((item) => ({
    optional: item.optional ?? false,
    ingredient: {
      name: item.name,
      normalizedName: normalizeIngredientName(item.name),
    },
  }));

  return {
    id,
    title,
    slug: id,
    description: `Descrição de ${title}`,
    prepMinutes: 20,
    servings: 2,
    ingredients: recipeIngredients,
  };
}

function makeService(recipes: MatchingRecipe[]): MatchingService {
  const repository: MatchingRecipesReader = {
    findAll: async () => recipes,
  };

  return new MatchingService(repository);
}

describe('MatchingService', () => {
  it('calcula 100% quando todos os ingredientes obrigatórios estão disponíveis', async () => {
    const service = makeService([
      makeRecipe('Panqueca', [{ name: 'Ovo' }, { name: 'Leite' }, { name: 'Farinha' }]),
    ]);

    const [result] = await service.match(['ovo', 'leite', 'farinha']);

    expect(result?.compatibility).toBe(100);
    expect(result?.foundIngredients).toEqual(['ovo', 'leite', 'farinha']);
    expect(result?.missingIngredients).toEqual([]);
  });

  it('lista ingredientes faltantes e arredonda a compatibilidade', async () => {
    const service = makeService([
      makeRecipe('Bolo', [
        { name: 'Banana' },
        { name: 'Farinha' },
        { name: 'Ovo' },
        { name: 'Leite' },
        { name: 'Fermento' },
      ]),
    ]);

    const [result] = await service.match(['banana', 'farinha', 'ovo', 'leite']);

    expect(result?.compatibility).toBe(80);
    expect(result?.missingIngredients).toEqual(['fermento']);
  });

  it('calcula 0% quando nenhum ingrediente obrigatório está disponível', async () => {
    const service = makeService([
      makeRecipe('Omelete', [{ name: 'Ovo' }, { name: 'Tomate' }]),
    ]);

    const [result] = await service.match(['arroz']);

    expect(result?.compatibility).toBe(0);
    expect(result?.foundIngredients).toEqual([]);
    expect(result?.missingIngredients).toEqual(['ovo', 'tomate']);
  });

  it('normaliza espaços, caixa e acentuação antes da comparação', async () => {
    const service = makeService([makeRecipe('Doce', [{ name: 'Açúcar' }])]);

    const [result] = await service.match(['  ACUCAR  ']);

    expect(normalizeIngredientName('  AÇÚCAR  ')).toBe('acucar');
    expect(result?.compatibility).toBe(100);
    expect(result?.foundIngredients).toEqual(['acucar']);
  });

  it('ordena as receitas da maior compatibilidade para a menor', async () => {
    const service = makeService([
      makeRecipe('Menor', [{ name: 'Ovo' }, { name: 'Leite' }]),
      makeRecipe('Maior', [{ name: 'Ovo' }]),
      makeRecipe('Zero', [{ name: 'Tomate' }]),
    ]);

    const results = await service.match(['ovo']);

    expect(results.map((result) => result.title)).toEqual(['Maior', 'Menor', 'Zero']);
    expect(results.map((result) => result.compatibility)).toEqual([100, 50, 0]);
  });

  it('ignora ingredientes opcionais no percentual e nas listas obrigatórias', async () => {
    const service = makeService([
      makeRecipe('Omelete', [{ name: 'Ovo' }, { name: 'Queijo', optional: true }]),
    ]);

    const [result] = await service.match(['ovo']);

    expect(result?.compatibility).toBe(100);
    expect(result?.requiredIngredients).toEqual(['ovo']);
    expect(result?.missingIngredients).toEqual([]);
  });
});
