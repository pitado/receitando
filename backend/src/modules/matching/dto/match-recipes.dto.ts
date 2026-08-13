import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class MatchRecipesDto {
  @ApiProperty({
    example: ['ovo', 'banana', 'farinha de trigo', 'leite'],
    type: String,
    isArray: true,
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  @Matches(/\S/, { each: true, message: 'ingredients não aceita valores vazios' })
  @MaxLength(100, { each: true })
  ingredients!: string[];
}
