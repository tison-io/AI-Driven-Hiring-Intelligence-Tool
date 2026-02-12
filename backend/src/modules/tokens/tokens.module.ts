import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TokensService } from './tokens.service';
import {
  ResultsToken,
  ResultsTokenSchema,
} from '../results-tokens/entities/results-token.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ResultsToken.name, schema: ResultsTokenSchema },
    ]),
  ],
  providers: [TokensService],
  exports: [TokensService],
})
export class TokensModule {}