import { Module } from '@nestjs/common';

import { SecurityModule } from '../../common/security.module';
import { IngredientsController } from './ingredients.controller';
import { IngredientsRepository } from './ingredients.repository';
import { IngredientsService } from './ingredients.service';

@Module({
  imports: [SecurityModule],
  controllers: [IngredientsController],
  providers: [IngredientsRepository, IngredientsService],
  exports: [IngredientsService],
})
export class IngredientsModule {}
