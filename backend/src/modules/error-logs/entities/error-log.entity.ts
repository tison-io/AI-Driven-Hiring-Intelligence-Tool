import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ErrorLogDocument = ErrorLog & Document;

@Schema({ timestamps: true })
export class ErrorLog {
  @Prop({ required: true, type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ required: true })
  userOrSystem: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  target: string;

  @Prop({ required: true })
  details: string;

  @Prop({ required: true, enum: ['info', 'warning', 'error', 'critical'] })
  severity: string;
}

export const ErrorLogSchema = SchemaFactory.createForClass(ErrorLog);
