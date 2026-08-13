import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { CreateRecipeIngredientDto } from './create-recipe-ingredient.dto';

export class CreateRecipeDto {
  @ApiProperty({ example: 'Panqueca de banana', maxLength: 160 })
  @IsString()
  @Matches(/\S/, { message: 'title não pode conter apenas espaços' })
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional({
    example: 'panqueca-de-banana',
    description: 'Quando omitido, é gerado a partir do título.',
    maxLength: 180,
  })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'slug não pode conter apenas espaços' })
  @MaxLength(180)
  slug?: string;

  @ApiProperty({ example: 'Panquecas macias para um café da manhã rápido.' })
  @IsString()
  @Matches(/\S/, { message: 'description não pode conter apenas espaços' })
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ example: '1. Misture os ingredientes.\n2. Doure na frigideira.' })
  @IsString()
  @Matches(/\S/, { message: 'instructions não pode conter apenas espaços' })
  @MaxLength(10000)
  instructions!: string;

  @ApiProperty({ example: 20, minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(1440)
  prepMinutes!: number;

  @ApiProperty({ example: 4, minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(1000)
  servings!: number;

  @ApiProperty({ type: CreateRecipeIngredientDto, isArray: true, minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique((item: CreateRecipeIngredientDto) => item.ingredientId, {
    message: 'Um ingrediente não pode aparecer mais de uma vez na receita.',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateRecipeIngredientDto)
  ingredients!: CreateRecipeIngredientDto[];
}
