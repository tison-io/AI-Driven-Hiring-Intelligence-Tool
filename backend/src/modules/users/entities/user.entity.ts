import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../../common/enums/user-role.enum';

export type UserDocument = User &
  Document & {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ enum: UserRole, default: UserRole.RECRUITER })
  role: UserRole;

  @Prop()
  fullName?: string;

  @Prop()
  jobTitle?: string;

  @Prop()
  companyName?: string;

  @Prop()
  userPhoto?: string;

  @Prop()
  companyLogo?: string;

  @Prop({ default: false })
  profileCompleted?: boolean;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ default: false })
  passwordResetUsed?: boolean;

  @Prop({ type: [String], default: [] })
  passwordHistory?: string[];

  @Prop({ default: 0 })
  passwordResetAttempts?: number;

  @Prop()
  lastPasswordResetRequest?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
