import { Module } from '@nestjs/common';

import { MatchingModule } from '../matching/matching.module';
import { RecipesController } from './recipes.controller';
import { RecipesRepository } from './recipes.repository';
import { RecipesService } from './recipes.service';

@Module({
  imports: [MatchingModule],
  controllers: [RecipesController],
  providers: [RecipesRepository, RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
