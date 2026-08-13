import { Module } from '@nestjs/common';

import { HealthModule } from '../../src/modules/health/health.module';
import { IngredientsModule } from '../../src/modules/ingredients/ingredients.module';
import { RecipesModule } from '../../src/modules/recipes/recipes.module';
import { WorkerPrismaModule } from './prisma/worker-prisma.module';

@Module({
  imports: [
    WorkerPrismaModule,
    HealthModule,
    IngredientsModule,
    RecipesModule,
  ],
})
export class WorkerAppModule {}
