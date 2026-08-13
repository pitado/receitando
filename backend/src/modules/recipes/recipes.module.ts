import { Module } from '@nestjs/common';

import { SecurityModule } from '../../common/security.module';
import { RateLimitService } from '../../common/services/rate-limit.service';
import { MatchingModule } from '../matching/matching.module';
import { RecipesController } from './recipes.controller';
import { RecipesRepository } from './recipes.repository';
import { RecipesService } from './recipes.service';

@Module({
  imports: [MatchingModule, SecurityModule],
  controllers: [RecipesController],
  providers: [RecipesRepository, RecipesService, RateLimitService],
  exports: [RecipesService],
})
export class RecipesModule {}
