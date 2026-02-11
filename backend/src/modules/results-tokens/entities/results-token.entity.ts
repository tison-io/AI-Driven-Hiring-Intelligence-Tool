import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type ResultsTokenDocument = ResultsToken & Document;

@Schema({ timestamps: true })
export class ResultsToken {
  @Prop({ required: true, index: true, unique: true })
  tokenId: string;

  @Prop({ required: true })
  token: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Candidate',
    required: true,
    index: true,
  })
  candidateId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'JobPosting',
    required: true,
    index: true,
  })
  jobPostingId: Types.ObjectId;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isUsed: boolean;
}

export const ResultsTokenSchema = SchemaFactory.createForClass(ResultsToken);
ResultsTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 } as any);
ResultsTokenSchema.index({ tokenId: 1, expiresAt: 1, isUsed: 1 });