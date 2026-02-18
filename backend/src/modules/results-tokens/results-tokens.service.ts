import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ResultsToken, ResultsTokenDocument } from './entities/results-token.entity';
import * as crypto from 'crypto';

@Injectable()
export class ResultsTokensService {
  constructor(
    @InjectModel(ResultsToken.name)
    private resultsTokenModel: Model<ResultsTokenDocument>,
  ) {}

  async generateToken(
    candidateId: string | Types.ObjectId,
    jobPostingId: string | Types.ObjectId,
  ): Promise<string> {
    const token = crypto.randomBytes(16).toString('hex');
    const tokenId = crypto.randomBytes(8).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.resultsTokenModel.create({
      tokenId,
      token,
      candidateId: new Types.ObjectId(candidateId),
      jobPostingId: new Types.ObjectId(jobPostingId),
      expiresAt,
      isUsed: false,
    });

    return token;
  }

  async validateToken(token: string) {
    const resultsToken = await this.resultsTokenModel
      .findOne({ token })
      .populate('candidateId')
      .populate('jobPostingId')
      .exec();

    if (!resultsToken) {
      throw new NotFoundException('Invalid or expired token');
    }

    if (resultsToken.expiresAt < new Date()) {
      throw new NotFoundException('Token has expired');
    }

    // Mark as used
    if (!resultsToken.isUsed) {
      await this.resultsTokenModel.updateOne(
        { token },
        { isUsed: true },
      );
    }

    return resultsToken;
  }
}
