import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { normalizeIngredientName } from '../../common/utils/normalize-ingredient-name';
import { isPrismaErrorWithCode } from '../../common/utils/prisma-error';
import type { CreateIngredientDto } from './dto/create-ingredient.dto';
import type { UpdateIngredientDto } from './dto/update-ingredient.dto';
import type { IngredientRecord, UpdateIngredientRecord } from './ingredient.types';
import { IngredientsRepository } from './ingredients.repository';

@Injectable()
export class IngredientsService {
  constructor(private readonly ingredientsRepository: IngredientsRepository) {}

  findAll(): Promise<IngredientRecord[]> {
    return this.ingredientsRepository.findAll();
  }

  async findOne(id: string): Promise<IngredientRecord> {
    const ingredient = await this.ingredientsRepository.findById(id);

    if (!ingredient) {
      throw new NotFoundException('Ingrediente não encontrado.');
    }

    return ingredient;
  }

  async create(dto: CreateIngredientDto): Promise<IngredientRecord> {
    const name = dto.name.trim();
    const category = dto.category.trim();
    const normalizedName = normalizeIngredientName(name);

    if (!normalizedName || !category) {
      throw new BadRequestException('Nome e categoria são obrigatórios.');
    }

    try {
      return await this.ingredientsRepository.create({ name, normalizedName, category });
    } catch (error: unknown) {
      if (isPrismaErrorWithCode(error, 'P2002')) {
        throw new ConflictException('Já existe um ingrediente com esse nome.');
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateIngredientDto): Promise<IngredientRecord> {
    await this.findOne(id);

    if (dto.name === undefined && dto.category === undefined) {
      throw new BadRequestException('Informe ao menos um campo para atualizar.');
    }

    const data: UpdateIngredientRecord = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      const normalizedName = normalizeIngredientName(name);

      if (!normalizedName) {
        throw new BadRequestException('O nome do ingrediente é obrigatório.');
      }

      data.name = name;
      data.normalizedName = normalizedName;
    }

    if (dto.category !== undefined) {
      const category = dto.category.trim();

      if (!category) {
        throw new BadRequestException('A categoria do ingrediente é obrigatória.');
      }

      data.category = category;
    }

    try {
      return await this.ingredientsRepository.update(id, data);
    } catch (error: unknown) {
      if (isPrismaErrorWithCode(error, 'P2002')) {
        throw new ConflictException('Já existe um ingrediente com esse nome.');
      }

      if (isPrismaErrorWithCode(error, 'P2025')) {
        throw new NotFoundException('Ingrediente não encontrado.');
      }

      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.ingredientsRepository.delete(id);
    } catch (error: unknown) {
      if (isPrismaErrorWithCode(error, 'P2025')) {
        throw new NotFoundException('Ingrediente não encontrado.');
      }

      if (isPrismaErrorWithCode(error, 'P2003')) {
        throw new ConflictException(
          'O ingrediente está em uso e não pode ser removido.',
        );
      }

      throw error;
    }
  }
}
