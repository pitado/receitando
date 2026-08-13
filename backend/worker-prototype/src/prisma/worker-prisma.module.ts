import { Global, Module, Scope } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from 'cloudflare:workers';

import { PrismaService } from '../../../src/prisma/prisma.service';

/**
 * Workers must not keep a request-created database client in module state.
 * Nest propagates this request scope to repositories that inject PrismaService.
 */
const workerPrismaProvider = {
  provide: PrismaService,
  scope: Scope.REQUEST,
  useFactory: (): PrismaService => {
    const adapter = new PrismaPg({
      connectionString: env.HYPERDRIVE.connectionString,
    });

    return new PrismaService({ adapter });
  },
};

@Global()
@Module({
  providers: [workerPrismaProvider],
  exports: [workerPrismaProvider],
})
export class WorkerPrismaModule {}
