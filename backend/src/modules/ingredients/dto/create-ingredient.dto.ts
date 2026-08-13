import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class CreateIngredientDto {
  @ApiProperty({ example: 'Tomate', maxLength: 100 })
  @IsString()
  @Matches(/\S/, { message: 'name não pode conter apenas espaços' })
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'vegetais', maxLength: 80 })
  @IsString()
  @Matches(/\S/, { message: 'category não pode conter apenas espaços' })
  @MaxLength(80)
  category!: string;
}
