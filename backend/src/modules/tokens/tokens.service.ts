import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ResultsToken,
  ResultsTokenDocument,
} from '../results-tokens/entities/results-token.entity';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

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
    const rawToken = this.generateSecureToken();
    const tokenId = rawToken.substring(0, 16);
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.resultsTokenModel.create({
      tokenId,
      token: hashedToken,
      candidateId,
      jobPostingId,
      expiresAt,
    });

    return rawToken;
  }

  async validateToken(rawToken: string): Promise<ResultsTokenDocument | null> {
    if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 32) {
      return null;
    }
    
    const normalizedToken = rawToken.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(normalizedToken)) {
      return null;
    }
    
    const tokenId = normalizedToken.substring(0, 16);
    const tokenDoc = await this.resultsTokenModel
      .findOne({
        tokenId,
        expiresAt: { $gt: new Date() },
        isUsed: false,
      })
      .exec();

    if (!tokenDoc) return null;

    const isValid = await bcrypt.compare(rawToken, tokenDoc.token);
    return isValid ? tokenDoc : null;
  }
}