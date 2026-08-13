import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { isPrismaErrorWithCode } from '../../common/utils/prisma-error';
import { slugify } from '../../common/utils/slugify';
import type { CreateRecipeDto } from './dto/create-recipe.dto';
import type { CreateRecipeIngredientDto } from './dto/create-recipe-ingredient.dto';
import type { UpdateRecipeDto } from './dto/update-recipe.dto';
import type {
  CreateRecipeRecord,
  RecipeIngredientWriteRecord,
  RecipeRecord,
  UpdateRecipeRecord,
} from './recipe.types';
import { RecipesRepository } from './recipes.repository';

@Injectable()
export class RecipesService {
  constructor(private readonly recipesRepository: RecipesRepository) {}

  findAll(): Promise<RecipeRecord[]> {
    return this.recipesRepository.findAll();
  }

  async findOne(id: string): Promise<RecipeRecord> {
    const recipe = await this.recipesRepository.findById(id);

    if (!recipe) {
      throw new NotFoundException('Receita não encontrada.');
    }

    return recipe;
  }

  async findBySlug(slug: string): Promise<RecipeRecord> {
    const recipe = await this.recipesRepository.findBySlug(slugify(slug));

    if (!recipe) {
      throw new NotFoundException('Receita não encontrada.');
    }

    return recipe;
  }

  async create(dto: CreateRecipeDto): Promise<RecipeRecord> {
    const ingredients = this.mapIngredients(dto.ingredients);
    await this.assertIngredientsExist(ingredients);

    const data: CreateRecipeRecord = {
      title: dto.title.trim(),
      slug: this.parseSlug(dto.slug ?? dto.title),
      description: dto.description.trim(),
      instructions: dto.instructions.trim(),
      prepMinutes: dto.prepMinutes,
      servings: dto.servings,
      ingredients,
    };

    try {
      return await this.recipesRepository.create(data);
    } catch (error: unknown) {
      this.handleWriteError(error);
    }
  }

  async update(id: string, dto: UpdateRecipeDto): Promise<RecipeRecord> {
    await this.findOne(id);

    if (
      dto.title === undefined &&
      dto.slug === undefined &&
      dto.description === undefined &&
      dto.instructions === undefined &&
      dto.prepMinutes === undefined &&
      dto.servings === undefined &&
      dto.ingredients === undefined
    ) {
      throw new BadRequestException('Informe ao menos um campo para atualizar.');
    }

    const data: UpdateRecipeRecord = {};

    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.slug !== undefined) data.slug = this.parseSlug(dto.slug);
    if (dto.description !== undefined) data.description = dto.description.trim();
    if (dto.instructions !== undefined) data.instructions = dto.instructions.trim();
    if (dto.prepMinutes !== undefined) data.prepMinutes = dto.prepMinutes;
    if (dto.servings !== undefined) data.servings = dto.servings;

    if (dto.ingredients !== undefined) {
      data.ingredients = this.mapIngredients(dto.ingredients);
      await this.assertIngredientsExist(data.ingredients);
    }

    try {
      return await this.recipesRepository.update(id, data);
    } catch (error: unknown) {
      this.handleWriteError(error);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.recipesRepository.delete(id);
    } catch (error: unknown) {
      if (isPrismaErrorWithCode(error, 'P2025')) {
        throw new NotFoundException('Receita não encontrada.');
      }

      throw error;
    }
  }

  private mapIngredients(
    ingredients: CreateRecipeIngredientDto[],
  ): RecipeIngredientWriteRecord[] {
    const uniqueIds = new Set(ingredients.map((item) => item.ingredientId));

    if (uniqueIds.size !== ingredients.length) {
      throw new BadRequestException(
        'Um ingrediente não pode aparecer mais de uma vez na receita.',
      );
    }

    return ingredients.map((item) => ({
      ingredientId: item.ingredientId,
      quantity: item.quantity,
      unit: item.unit?.trim(),
      optional: item.optional ?? false,
    }));
  }

  private async assertIngredientsExist(
    ingredients: RecipeIngredientWriteRecord[],
  ): Promise<void> {
    const ids = ingredients.map((item) => item.ingredientId);
    const count = await this.recipesRepository.countIngredients(ids);

    if (count !== ids.length) {
      throw new BadRequestException('Um ou mais ingredientes informados não existem.');
    }
  }

  private parseSlug(value: string): string {
    const slug = slugify(value);

    if (!slug) {
      throw new BadRequestException('Não foi possível gerar um slug válido.');
    }

    return slug;
  }

  private handleWriteError(error: unknown): never {
    if (isPrismaErrorWithCode(error, 'P2002')) {
      throw new ConflictException('Já existe uma receita com esse slug.');
    }

    if (isPrismaErrorWithCode(error, 'P2025')) {
      throw new NotFoundException('Receita não encontrada.');
    }

    if (isPrismaErrorWithCode(error, 'P2003')) {
      throw new BadRequestException('Um ou mais ingredientes informados não existem.');
    }

    throw error;
  }
}
