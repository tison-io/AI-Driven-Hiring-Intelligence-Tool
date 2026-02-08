import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';
import { CompleteProfileDto } from '../auth/dto/complete-profile.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { MilestoneDetectionService } from '../notifications/automation/milestone-detection.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private milestoneDetectionService: MilestoneDetectionService,
  ) {}

  async create(registerDto: RegisterDto): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    const user = new this.userModel({
      ...registerDto,
      password: hashedPassword,
      role: UserRole.RECRUITER,
    });
    
    const savedUser = await user.save();
    
    // Check for user milestone after creating new user
    await this.milestoneDetectionService.checkUserMilestone();
    
    return savedUser;
  }

  async createAdmin(email: string, password: string): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new this.userModel({
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      profileCompleted: true,
    });
    
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { password: hashedPassword }).exec();
  }

  async updateProfile(id: string, updateData: Partial<User>): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async completeProfile(id: string, profileData: CompleteProfileDto & { userPhoto?: string; companyLogo?: string }): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      id, 
      { ...profileData, profileCompleted: true }, 
      { new: true }
    ).exec();
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  async setPasswordResetToken(email: string, hashedToken: string, expires: Date): Promise<void> {
    await this.userModel.findOneAndUpdate(
      { email },
      {
        passwordResetToken: hashedToken,
        passwordResetExpires: expires,
        passwordResetUsed: false,
        $inc: { passwordResetAttempts: 1 },
        lastPasswordResetRequest: new Date(),
      }
    ).exec();
  }

  async findByResetToken(hashedToken: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
      passwordResetUsed: false,
    }).exec();
  }

  async resetPassword(userId: string, hashedPassword: string, oldPasswordHash: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      passwordResetUsed: true,
      $push: { passwordHistory: { $each: [oldPasswordHash], $slice: -5 } },
    }).exec();
  }

  async canRequestReset(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) return true;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (user.lastPasswordResetRequest && user.lastPasswordResetRequest > oneHourAgo) {
      return user.passwordResetAttempts < 3;
    }

    await this.userModel.findByIdAndUpdate(user._id, { passwordResetAttempts: 0 }).exec();
    return true;
  }

  async createOAuthUser(oauthData: {
    email: string;
    password: string;
    fullName: string;
    userPhoto?: string;
    googleId: string;
    authProvider: string;
  }): Promise<UserDocument> {
    const user = new this.userModel({
      ...oauthData,
      role: UserRole.RECRUITER,
      profileCompleted: false,
    });
    
    const savedUser = await user.save();
    
    // Check for user milestone after creating new OAuth user
    await this.milestoneDetectionService.checkUserMilestone();
    
    return savedUser;
  }
}