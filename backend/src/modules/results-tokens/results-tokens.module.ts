import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResultsToken, ResultsTokenSchema } from './entities/results-token.entity';
import { ResultsTokensService } from './results-tokens.service';
import { ResultsTokensController } from './results-tokens.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ResultsToken.name, schema: ResultsTokenSchema },
    ]),
  ],
  controllers: [ResultsTokensController],
  providers: [ResultsTokensService],
  exports: [ResultsTokensService],
})
export class ResultsTokensModule {}