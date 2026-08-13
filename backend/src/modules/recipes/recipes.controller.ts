import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { MatchRecipeResultDto } from '../matching/dto/match-recipe-result.dto';
import { MatchRecipesDto } from '../matching/dto/match-recipes.dto';
import type { MatchRecipeResult } from '../matching/matching.types';
import { MatchingService } from '../matching/matching.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { RecipeDto } from './dto/recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import type { RecipeRecord } from './recipe.types';
import { RecipesService } from './recipes.service';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
  constructor(
    private readonly recipesService: RecipesService,
    private readonly matchingService: MatchingService,
  ) {}

  @Post('match')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ordena receitas pela compatibilidade com os ingredientes informados.' })
  @ApiOkResponse({ type: MatchRecipeResultDto, isArray: true })
  @ApiBadRequestResponse({ description: 'Lista de ingredientes inválida.' })
  match(@Body() dto: MatchRecipesDto): Promise<MatchRecipeResult[]> {
    return this.matchingService.match(dto.ingredients);
  }

  @Get()
  @ApiOkResponse({ type: RecipeDto, isArray: true })
  findAll(): Promise<RecipeRecord[]> {
    return this.recipesService.findAll();
  }

  @Get('slug/:slug')
  @ApiParam({ name: 'slug', example: 'panqueca-de-banana' })
  @ApiOkResponse({ type: RecipeDto })
  @ApiNotFoundResponse({ description: 'Receita não encontrada.' })
  findBySlug(@Param('slug') slug: string): Promise<RecipeRecord> {
    return this.recipesService.findBySlug(slug);
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: RecipeDto })
  @ApiNotFoundResponse({ description: 'Receita não encontrada.' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<RecipeRecord> {
    return this.recipesService.findOne(id);
  }

  @Post()
  @ApiCreatedResponse({ type: RecipeDto })
  @ApiBadRequestResponse({ description: 'Dados ou ingredientes inválidos.' })
  @ApiConflictResponse({ description: 'Já existe uma receita com esse slug.' })
  create(@Body() dto: CreateRecipeDto): Promise<RecipeRecord> {
    return this.recipesService.create(dto);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: RecipeDto })
  @ApiNotFoundResponse({ description: 'Receita não encontrada.' })
  @ApiBadRequestResponse({ description: 'Dados ou ingredientes inválidos.' })
  @ApiConflictResponse({ description: 'Já existe uma receita com esse slug.' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateRecipeDto,
  ): Promise<RecipeRecord> {
    return this.recipesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Receita removida.' })
  @ApiNotFoundResponse({ description: 'Receita não encontrada.' })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.recipesService.remove(id);
  }
}
