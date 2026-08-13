import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  CreateIngredientRecord,
  IngredientRecord,
  UpdateIngredientRecord,
} from './ingredient.types';

@Injectable()
export class IngredientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<IngredientRecord[]> {
    return this.prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
  }

  findById(id: string): Promise<IngredientRecord | null> {
    return this.prisma.ingredient.findUnique({ where: { id } });
  }

  create(data: CreateIngredientRecord): Promise<IngredientRecord> {
    return this.prisma.ingredient.create({ data });
  }

  update(id: string, data: UpdateIngredientRecord): Promise<IngredientRecord> {
    return this.prisma.ingredient.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.ingredient.delete({ where: { id } });
  }
}
