import { Module } from '@nestjs/common';

import { IngredientsController } from './ingredients.controller';
import { IngredientsRepository } from './ingredients.repository';
import { IngredientsService } from './ingredients.service';

@Module({
  controllers: [IngredientsController],
  providers: [IngredientsRepository, IngredientsService],
  exports: [IngredientsService],
})
export class IngredientsModule {}
