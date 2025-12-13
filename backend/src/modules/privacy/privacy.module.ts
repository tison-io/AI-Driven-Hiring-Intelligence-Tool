import { Module } from '@nestjs/common';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';
import { CandidatesModule } from '../candidates/candidates.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CandidatesModule, UsersModule],
  controllers: [PrivacyController],
  providers: [PrivacyService],
})
export class PrivacyModule {}
