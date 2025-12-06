import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../../../common/enums/user-role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id?: any;
  
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
}

export const UserSchema = SchemaFactory.createForClass(User);