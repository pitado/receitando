import { ApiProperty } from '@nestjs/swagger';

export class IngredientDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Tomate' })
  name!: string;

  @ApiProperty({ example: 'tomate' })
  normalizedName!: string;

  @ApiProperty({ example: 'vegetais' })
  category!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
