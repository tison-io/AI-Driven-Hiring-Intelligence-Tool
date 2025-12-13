import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { CandidatesModule } from '../candidates/candidates.module';

@Module({
  imports: [CandidatesModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
