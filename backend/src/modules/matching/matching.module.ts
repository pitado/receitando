import { Module } from '@nestjs/common';

import { MatchingRepository } from './matching.repository';
import { MatchingService } from './matching.service';

@Module({
  providers: [MatchingRepository, MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
