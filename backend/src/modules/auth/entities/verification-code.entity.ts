import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VerificationCodeDocument = VerificationCode & Document & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class VerificationCode {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  codeHash: string;

  @Prop({ required: true, expires: 0 })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;
}

export const VerificationCodeSchema = SchemaFactory.createForClass(VerificationCode);

// Index for faster userId lookups
VerificationCodeSchema.index({ userId: 1 });
