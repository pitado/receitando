import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateRecipeIngredientDto {
  @ApiProperty({ format: 'uuid', description: 'Identificador de um ingrediente existente.' })
  @IsUUID('4')
  ingredientId!: string;

  @ApiPropertyOptional({ example: 2, minimum: 0.01 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity?: number;

  @ApiPropertyOptional({ example: 'unidades', maxLength: 50 })
  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: 'unit não pode conter apenas espaços' })
  @MaxLength(50)
  unit?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  optional?: boolean;
}
