import { ApiProperty } from '@nestjs/swagger';

export class MatchRecipeResultDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Panqueca de banana' })
  title!: string;

  @ApiProperty({ example: 'panqueca-de-banana' })
  slug!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ example: 15 })
  prepMinutes!: number;

  @ApiProperty({ example: 2 })
  servings!: number;

  @ApiProperty({ example: 100, minimum: 0, maximum: 100 })
  compatibility!: number;

  @ApiProperty({
    example: ['banana', 'farinha de trigo', 'leite', 'ovo'],
    type: String,
    isArray: true,
  })
  requiredIngredients!: string[];

  @ApiProperty({
    example: ['banana', 'farinha de trigo', 'leite', 'ovo'],
    type: String,
    isArray: true,
  })
  foundIngredients!: string[];

  @ApiProperty({ example: [], type: String, isArray: true })
  missingIngredients!: string[];
}
