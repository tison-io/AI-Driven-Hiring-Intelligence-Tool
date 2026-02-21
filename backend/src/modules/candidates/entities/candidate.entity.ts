import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ProcessingStatus } from '../../../common/enums/processing-status.enum';

export type CandidateDocument = Candidate & Document;

@Schema({ timestamps: true })
export class Candidate {
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
  workExperience: {
    company: string;
    jobTitle: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];

  @Prop({ type: [Object], default: [] })
  education: any[];

  @Prop({ type: [String], default: [] })
  certifications: string[];

  @Prop({ min: 0, max: 100 })
  roleFitScore?: number;

  @Prop({ type: Object })
  scoringBreakdown?: any;

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

  @Prop()
  jobDescription?: string;

  @Prop({ type: String, required: true })
  createdBy: string;

  @Prop({ enum: ProcessingStatus, default: ProcessingStatus.PENDING })
  status: ProcessingStatus;

  @Prop({ default: false })
  isShortlisted: boolean;

  @Prop({ 
    enum: ['to_review', 'shortlisted', 'rejected', 'hired'],
    default: 'to_review'
  })
  hiringStatus: string;

  @Prop()
  fileUrl?: string;

  @Prop({ enum: ['linkedin', 'file'], required: true })
  source: 'linkedin' | 'file';

  @Prop()
  processingTime?: number; // in milliseconds

  @Prop({ type: Types.ObjectId, ref: 'JobPosting' })
  jobPostingId?: Types.ObjectId;

  @Prop()
  email?: string;

  @Prop({ default: false })
  emailSent: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);

// Add indexes for performance optimization
CandidateSchema.index({ createdBy: 1 }); // User-scoped queries
CandidateSchema.index({ status: 1 }); // Status filtering
CandidateSchema.index({ createdBy: 1, status: 1 }); // Compound index for common combination
CandidateSchema.index({ roleFitScore: 1 }); // Sorting and filtering by score
CandidateSchema.index({ createdAt: -1 }); // Time-based sorting and filtering
CandidateSchema.index({ isShortlisted: 1 }); // Shortlist queries