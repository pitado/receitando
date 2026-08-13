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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { IngredientDto } from './dto/ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import type { IngredientRecord } from './ingredient.types';
import { IngredientsService } from './ingredients.service';

@ApiTags('ingredients')
@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get()
  @ApiOkResponse({ type: IngredientDto, isArray: true })
  findAll(): Promise<IngredientRecord[]> {
    return this.ingredientsService.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: IngredientDto })
  @ApiNotFoundResponse({ description: 'Ingrediente não encontrado.' })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<IngredientRecord> {
    return this.ingredientsService.findOne(id);
  }

  @Post()
  @ApiCreatedResponse({ type: IngredientDto })
  @ApiConflictResponse({ description: 'Já existe um ingrediente com esse nome.' })
  create(@Body() dto: CreateIngredientDto): Promise<IngredientRecord> {
    return this.ingredientsService.create(dto);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: IngredientDto })
  @ApiNotFoundResponse({ description: 'Ingrediente não encontrado.' })
  @ApiConflictResponse({ description: 'Já existe um ingrediente com esse nome.' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateIngredientDto,
  ): Promise<IngredientRecord> {
    return this.ingredientsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiNoContentResponse({ description: 'Ingrediente removido.' })
  @ApiNotFoundResponse({ description: 'Ingrediente não encontrado.' })
  @ApiConflictResponse({ description: 'Ingrediente em uso.' })
  remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    return this.ingredientsService.remove(id);
  }
}
