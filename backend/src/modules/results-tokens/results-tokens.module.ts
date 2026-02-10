import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ResultsToken, ResultsTokenSchema } from './entities/results-token.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ResultsToken.name, schema: ResultsTokenSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ResultsTokensModule {}