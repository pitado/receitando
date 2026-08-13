import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import type { MatchingRecipe, MatchingRecipesReader } from './matching.types';

@Injectable()
export class MatchingRepository implements MatchingRecipesReader {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<MatchingRecipe[]> {
    return this.prisma.recipe.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        prepMinutes: true,
        servings: true,
        ingredients: {
          select: {
            optional: true,
            ingredient: { select: { name: true, normalizedName: true } },
          },
          orderBy: { ingredient: { normalizedName: 'asc' } },
        },
      },
    });
  }
}
