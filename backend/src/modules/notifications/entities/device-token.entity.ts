import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeviceTokenDocument = DeviceToken & Document;

export enum DevicePlatform {
  WEB = 'WEB',
  ANDROID = 'ANDROID',
  IOS = 'IOS',
}

@Schema({ timestamps: true })
export class DeviceToken {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ 
    type: String, 
    enum: DevicePlatform, 
    required: true 
  })
  platform: DevicePlatform;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  userAgent?: string;

  @Prop()
  lastUsed: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ 
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    index: { expireAfterSeconds: 0 } // TTL index
  })
  expiresAt: Date;
}

export const DeviceTokenSchema = SchemaFactory.createForClass(DeviceToken);

// Compound indexes
DeviceTokenSchema.index({ userId: 1, platform: 1 });
DeviceTokenSchema.index({ userId: 1, isActive: 1 });