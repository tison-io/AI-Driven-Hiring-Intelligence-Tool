import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobPostingDocument = JobPosting & Document;

export const CURRENCY_ENUM = [
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL',
  'MXN', 'ZAR', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK',
  'HUF', 'RUB', 'TRY', 'KRW', 'THB', 'MYR', 'IDR', 'PHP', 'VND', 'EGP',
  'NGN', 'KES', 'GHS', 'MAD', 'TND', 'DZD', 'AED', 'SAR', 'QAR', 'KWD',
  'BHD', 'OMR', 'JOD', 'LBP', 'ILS', 'PKR', 'BDT', 'LKR', 'NPR', 'MMK',
  'KHR', 'LAK', 'UZS', 'KZT', 'KGS', 'TJS', 'TMT', 'AFN', 'IRR', 'IQD',
  'SYP', 'YER', 'ETB', 'UGX', 'TZS', 'RWF', 'MWK', 'ZMW', 'BWP', 'SZL',
  'LSL', 'NAD', 'MZN', 'AOA', 'CDF', 'XAF', 'XOF', 'XPF', 'FJD', 'PGK',
  'SBD', 'TOP', 'VUV', 'WST'
] as const;

type Currency = typeof CURRENCY_ENUM[number];

@Schema()
class Salary {
  @Prop({ required: true, type: Number, min: 0 })
  min: number;

  @Prop({ required: true, type: Number, min: 0 })
  max: number;

  @Prop({ required: true, type: String, enum: CURRENCY_ENUM })
  currency: string;
}

@Schema({ timestamps: true })
export class JobPosting {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  responsibilities: string[];

  @Prop({ type: [String], default: [] })
  requiredSkills: string[];

  @Prop({ type: [String], default: [] })
  requirements: string[];

  @Prop({ required: true })
  location: string;

  @Prop({ 
    type: String, 
    enum: ['entry', 'mid', 'senior', 'lead', 'principal']
  })
  experienceLevel?: string;

  @Prop({ 
    type: String, 
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    default: 'full-time'
  })
  employmentType?: string;

  @Prop({ type: Date })
  closingDate?: Date;

  @Prop()
  companyName?: string;

  @Prop({ type: Salary, validate: {
    validator: function(v: Salary) {
      return !v || v.min <= v.max;
    },
    message: 'Minimum salary must be less than or equal to maximum salary'
  }})
  salary?: Salary;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  companyId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true, unique: true, index: true })
  applicationToken: string;
}

export const JobPostingSchema = SchemaFactory.createForClass(JobPosting);

// Pre-save hook to auto-generate applicationToken for legacy documents
JobPostingSchema.pre('save', function(next) {
  if (!this.applicationToken) {
    const crypto = require('crypto');
    this.applicationToken = crypto.randomBytes(16).toString('hex');
  }
  next();
});

JobPostingSchema.index({ title: 'text', description: 'text', location: 'text', companyName: 'text' });
JobPostingSchema.index({ companyId: 1, isActive: 1, createdAt: -1 });