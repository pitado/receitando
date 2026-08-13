import { PrismaClient } from '@prisma/client';

import { normalizeIngredientName } from '../src/common/utils/normalize-ingredient-name';

const prisma = new PrismaClient();

const ingredients = [
  { name: 'Ovo', category: 'proteínas' },
  { name: 'Banana', category: 'frutas' },
  { name: 'Farinha de trigo', category: 'grãos e farinhas' },
  { name: 'Leite', category: 'laticínios' },
  { name: 'Fermento', category: 'mercearia' },
  { name: 'Tomate', category: 'vegetais' },
  { name: 'Cebola', category: 'vegetais' },
  { name: 'Alho', category: 'vegetais' },
  { name: 'Arroz', category: 'grãos e farinhas' },
  { name: 'Macarrão', category: 'massas' },
  { name: 'Queijo', category: 'laticínios' },
  { name: 'Manteiga', category: 'laticínios' },
  { name: 'Açúcar', category: 'mercearia' },
  { name: 'Batata', category: 'vegetais' },
  { name: 'Cenoura', category: 'vegetais' },
  { name: 'Óleo', category: 'óleos e gorduras' },
  { name: 'Sal', category: 'temperos' },
] as const;

interface SeedRecipeIngredient {
  name: string;
  quantity?: number;
  unit?: string;
  optional?: boolean;
}

interface SeedRecipe {
  title: string;
  slug: string;
  description: string;
  instructions: string;
  prepMinutes: number;
  servings: number;
  ingredients: SeedRecipeIngredient[];
}

const recipes: SeedRecipe[] = [
  {
    title: 'Panqueca de banana',
    slug: 'panqueca-de-banana',
    description: 'Panquecas macias e naturalmente doces para um café da manhã rápido.',
    instructions:
      '1. Amasse a banana.\n2. Misture o ovo, o leite e a farinha até obter uma massa homogênea.\n3. Doure pequenas porções em uma frigideira aquecida.',
    prepMinutes: 15,
    servings: 2,
    ingredients: [
      { name: 'banana', quantity: 1, unit: 'unidade' },
      { name: 'ovo', quantity: 1, unit: 'unidade' },
      { name: 'farinha de trigo', quantity: 4, unit: 'colheres de sopa' },
      { name: 'leite', quantity: 100, unit: 'ml' },
      { name: 'manteiga', quantity: 1, unit: 'colher de chá', optional: true },
    ],
  },
  {
    title: 'Bolo de banana',
    slug: 'bolo-de-banana',
    description: 'Bolo caseiro úmido, perfumado e fácil de preparar.',
    instructions:
      '1. Amasse as bananas e misture com os ovos e o leite.\n2. Incorpore a farinha e o açúcar.\n3. Adicione o fermento por último.\n4. Asse a 180 °C por cerca de 35 minutos.',
    prepMinutes: 50,
    servings: 8,
    ingredients: [
      { name: 'banana', quantity: 3, unit: 'unidades' },
      { name: 'farinha de trigo', quantity: 2, unit: 'xícaras' },
      { name: 'ovo', quantity: 2, unit: 'unidades' },
      { name: 'leite', quantity: 1, unit: 'xícara' },
      { name: 'fermento', quantity: 1, unit: 'colher de sopa' },
      { name: 'açúcar', quantity: 0.75, unit: 'xícara', optional: true },
    ],
  },
  {
    title: 'Omelete de tomate',
    slug: 'omelete-de-tomate',
    description: 'Omelete leve com tomate, pronta em poucos minutos.',
    instructions:
      '1. Bata os ovos.\n2. Junte o tomate e a cebola picados.\n3. Tempere e cozinhe em frigideira tampada até firmar.',
    prepMinutes: 12,
    servings: 1,
    ingredients: [
      { name: 'ovo', quantity: 2, unit: 'unidades' },
      { name: 'tomate', quantity: 1, unit: 'unidade' },
      { name: 'cebola', quantity: 0.25, unit: 'unidade', optional: true },
      { name: 'sal', quantity: 1, unit: 'pitada', optional: true },
    ],
  },
  {
    title: 'Arroz com legumes',
    slug: 'arroz-com-legumes',
    description: 'Arroz colorido e prático para acompanhar as refeições do dia a dia.',
    instructions:
      '1. Refogue o alho e a cebola.\n2. Acrescente arroz e cenoura.\n3. Cubra com água e cozinhe em fogo baixo até secar.',
    prepMinutes: 30,
    servings: 4,
    ingredients: [
      { name: 'arroz', quantity: 1, unit: 'xícara' },
      { name: 'cenoura', quantity: 1, unit: 'unidade' },
      { name: 'cebola', quantity: 0.5, unit: 'unidade' },
      { name: 'alho', quantity: 1, unit: 'dente' },
      { name: 'sal', quantity: 1, unit: 'pitada', optional: true },
    ],
  },
  {
    title: 'Macarrão alho e óleo',
    slug: 'macarrao-alho-e-oleo',
    description: 'Um clássico rápido, aromático e feito com poucos ingredientes.',
    instructions:
      '1. Cozinhe o macarrão até ficar al dente.\n2. Doure o alho no óleo em fogo baixo.\n3. Misture a massa escorrida e ajuste o sal.',
    prepMinutes: 20,
    servings: 2,
    ingredients: [
      { name: 'macarrão', quantity: 200, unit: 'g' },
      { name: 'alho', quantity: 3, unit: 'dentes' },
      { name: 'óleo', quantity: 3, unit: 'colheres de sopa' },
      { name: 'sal', quantity: 1, unit: 'pitada', optional: true },
    ],
  },
  {
    title: 'Purê de batata',
    slug: 'pure-de-batata',
    description: 'Purê cremoso que combina com diferentes pratos.',
    instructions:
      '1. Cozinhe as batatas até ficarem macias.\n2. Amasse bem.\n3. Leve ao fogo baixo com leite e manteiga, mexendo até ficar cremoso.',
    prepMinutes: 35,
    servings: 4,
    ingredients: [
      { name: 'batata', quantity: 5, unit: 'unidades' },
      { name: 'leite', quantity: 150, unit: 'ml' },
      { name: 'manteiga', quantity: 2, unit: 'colheres de sopa' },
      { name: 'sal', quantity: 1, unit: 'pitada', optional: true },
    ],
  },
  {
    title: 'Panqueca simples',
    slug: 'panqueca-simples',
    description: 'Massa básica de panqueca para receber recheios doces ou salgados.',
    instructions:
      '1. Bata o ovo, o leite e a farinha.\n2. Despeje uma camada fina em frigideira aquecida.\n3. Vire quando as bordas soltarem e doure o outro lado.',
    prepMinutes: 20,
    servings: 4,
    ingredients: [
      { name: 'ovo', quantity: 1, unit: 'unidade' },
      { name: 'farinha de trigo', quantity: 1, unit: 'xícara' },
      { name: 'leite', quantity: 1, unit: 'xícara' },
      { name: 'manteiga', quantity: 1, unit: 'colher de chá', optional: true },
    ],
  },
  {
    title: 'Omelete de queijo',
    slug: 'omelete-de-queijo',
    description: 'Omelete dourada com queijo derretido no centro.',
    instructions:
      '1. Bata os ovos.\n2. Despeje em uma frigideira aquecida.\n3. Adicione o queijo, dobre a omelete e cozinhe até derreter.',
    prepMinutes: 10,
    servings: 1,
    ingredients: [
      { name: 'ovo', quantity: 2, unit: 'unidades' },
      { name: 'queijo', quantity: 50, unit: 'g' },
      { name: 'leite', quantity: 1, unit: 'colher de sopa', optional: true },
      { name: 'sal', quantity: 1, unit: 'pitada', optional: true },
    ],
  },
];

async function main(): Promise<void> {
  const ingredientIds = new Map<string, string>();

  for (const ingredient of ingredients) {
    const normalizedName = normalizeIngredientName(ingredient.name);
    const saved = await prisma.ingredient.upsert({
      where: { normalizedName },
      update: { name: ingredient.name, category: ingredient.category },
      create: { ...ingredient, normalizedName },
    });
    ingredientIds.set(normalizedName, saved.id);
  }

  for (const recipe of recipes) {
    const relationData = recipe.ingredients.map((item) => {
      const ingredientId = ingredientIds.get(normalizeIngredientName(item.name));

      if (!ingredientId) {
        throw new Error(`Ingrediente do seed não encontrado: ${item.name}`);
      }

      return {
        ingredientId,
        quantity: item.quantity,
        unit: item.unit,
        optional: item.optional ?? false,
      };
    });
    const recipeData = {
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      instructions: recipe.instructions,
      prepMinutes: recipe.prepMinutes,
      servings: recipe.servings,
    };

    await prisma.recipe.upsert({
      where: { slug: recipe.slug },
      update: {
        ...recipeData,
        ingredients: {
          deleteMany: {},
          create: relationData,
        },
      },
      create: {
        ...recipeData,
        ingredients: { create: relationData },
      },
    });
  }

  console.log(`Seed concluído: ${ingredients.length} ingredientes e ${recipes.length} receitas.`);
}

void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
