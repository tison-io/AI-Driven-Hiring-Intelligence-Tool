import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
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
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
