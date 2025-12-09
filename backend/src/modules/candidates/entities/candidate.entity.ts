import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ProcessingStatus } from '../../../common/enums/processing-status.enum';

export type CandidateDocument = Candidate & Document;

@Schema({ timestamps: true })
export class Candidate {
  _id?: any;
  
  @Prop({ required: true })
  name: string;

  @Prop()
  linkedinUrl?: string;

  @Prop({ required: true })
  rawText: string;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop({ default: 0 })
  experienceYears: number;

  @Prop({ type: [Object], default: [] })
  education: any[];

  @Prop({ type: [String], default: [] })
  certifications: string[];

  @Prop({ min: 0, max: 100 })
  roleFitScore?: number;

  @Prop({ type: [String], default: [] })
  keyStrengths: string[];

  @Prop({ type: [String], default: [] })
  potentialWeaknesses: string[];

  @Prop({ type: [String], default: [] })
  missingSkills: string[];

  @Prop({ type: [String], default: [] })
  interviewQuestions: string[];

  @Prop({ min: 0, max: 100 })
  confidenceScore?: number;

  @Prop()
  biasCheck?: string;

  @Prop({ required: true })
  jobRole: string;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ enum: ProcessingStatus, default: ProcessingStatus.PENDING })
  status: ProcessingStatus;

  @Prop({ default: false })
  isShortlisted: boolean;

  @Prop()
  fileUrl?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);