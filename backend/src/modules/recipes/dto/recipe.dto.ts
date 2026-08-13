import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { IngredientDto } from '../../ingredients/dto/ingredient.dto';

export class RecipeIngredientDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ nullable: true, example: 2 })
  quantity!: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'unidades' })
  unit!: string | null;

  @ApiProperty({ default: false })
  optional!: boolean;

  @ApiProperty({ type: IngredientDto })
  ingredient!: IngredientDto;
}

export class RecipeDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Panqueca de banana' })
  title!: string;

  @ApiProperty({ example: 'panqueca-de-banana' })
  slug!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  instructions!: string;

  @ApiProperty({ example: 20 })
  prepMinutes!: number;

  @ApiProperty({ example: 4 })
  servings!: number;

  @ApiProperty({ type: RecipeIngredientDto, isArray: true })
  ingredients!: RecipeIngredientDto[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
