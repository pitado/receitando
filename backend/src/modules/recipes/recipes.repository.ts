import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateRecipeRecord,
  RecipeIngredientWriteRecord,
  RecipeRecord,
  UpdateRecipeRecord,
} from './recipe.types';

const recipeInclude = {
  ingredients: {
    include: { ingredient: true },
    orderBy: { ingredient: { normalizedName: 'asc' as const } },
  },
} as const;

function toNestedIngredient(item: RecipeIngredientWriteRecord) {
  return {
    quantity: item.quantity,
    unit: item.unit,
    optional: item.optional,
    ingredient: { connect: { id: item.ingredientId } },
  };
}

@Injectable()
export class RecipesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<RecipeRecord[]> {
    return this.prisma.recipe.findMany({
      include: recipeInclude,
      orderBy: { title: 'asc' },
    });
  }

  findById(id: string): Promise<RecipeRecord | null> {
    return this.prisma.recipe.findUnique({ where: { id }, include: recipeInclude });
  }

  findBySlug(slug: string): Promise<RecipeRecord | null> {
    return this.prisma.recipe.findUnique({ where: { slug }, include: recipeInclude });
  }

  countIngredients(ids: string[]): Promise<number> {
    return this.prisma.ingredient.count({ where: { id: { in: ids } } });
  }

  create(data: CreateRecipeRecord): Promise<RecipeRecord> {
    return this.prisma.recipe.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        instructions: data.instructions,
        prepMinutes: data.prepMinutes,
        servings: data.servings,
        ingredients: { create: data.ingredients.map(toNestedIngredient) },
      },
      include: recipeInclude,
    });
  }

  update(id: string, data: UpdateRecipeRecord): Promise<RecipeRecord> {
    return this.prisma.$transaction(async (transaction) => {
      if (data.ingredients !== undefined) {
        await transaction.recipeIngredient.deleteMany({ where: { recipeId: id } });
      }

      return transaction.recipe.update({
        where: { id },
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description,
          instructions: data.instructions,
          prepMinutes: data.prepMinutes,
          servings: data.servings,
          ingredients:
            data.ingredients === undefined
              ? undefined
              : { create: data.ingredients.map(toNestedIngredient) },
        },
        include: recipeInclude,
      });
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recipe.delete({ where: { id } });
  }
}
