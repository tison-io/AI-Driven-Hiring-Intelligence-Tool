import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobPostingDocument = JobPosting & Document;

@Schema({ timestamps: true })
export class JobPosting {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], required: true })
  requirements: string[];

  @Prop({ required: true })
  location: string;

  @Prop({ type: Object })
  salary?: {
    min: number;
    max: number;
    currency: string;
  };

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  companyId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const JobPostingSchema = SchemaFactory.createForClass(JobPosting);