import { Module } from '@nestjs/common';

import { AdminApiKeyGuard } from './guards/admin-api-key.guard';

@Module({
  providers: [AdminApiKeyGuard],
  exports: [AdminApiKeyGuard],
})
export class SecurityModule {}
