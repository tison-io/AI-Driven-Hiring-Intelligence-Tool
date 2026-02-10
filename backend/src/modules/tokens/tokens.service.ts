import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ResultsToken,
  ResultsTokenDocument,
} from '../results-tokens/entities/results-token.entity';
import * as crypto from 'crypto';

@Injectable()
export class TokensService {
  constructor(
    @InjectModel(ResultsToken.name)
    private resultsTokenModel: Model<ResultsTokenDocument>,
  ) {}

  generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async createResultsToken(
    candidateId: string,
    jobPostingId: string,
  ): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.resultsTokenModel.create({
      token,
      candidateId,
      jobPostingId,
      expiresAt,
    });

    return token;
  }

  async validateToken(token: string): Promise<ResultsTokenDocument | null> {
    return this.resultsTokenModel
      .findOne({
        token,
        expiresAt: { $gt: new Date() },
        isUsed: false,
      })
      .exec();
  }
}