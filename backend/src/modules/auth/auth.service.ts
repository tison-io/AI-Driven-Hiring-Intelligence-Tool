import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const user = await this.usersService.create(registerDto);
    return this.generateAuthResponse(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Prevent OAuth-only users from using password login
    if (user.authProvider === 'google' && !user.password) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Please use the "Sign in with Google" button.'
      );
    }

    if (!(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Prevent OAuth-only users from changing password
    if (user.authProvider === 'google' && !user.password) {
      throw new BadRequestException(
        'Your account uses Google sign-in. Password management is handled by Google.'
      );
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await this.usersService.updatePassword(userId, hashedNewPassword);

    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userObj = user.toObject();
    const { password, ...result } = userObj;
    return result;
  }

  async completeProfile(userId: string, profileData: CompleteProfileDto, userPhoto?: string, companyLogo?: string) {
    const updateData = {
      ...profileData,
      ...(userPhoto && { userPhoto }),
      ...(companyLogo && { companyLogo })
    };

    const user = await this.usersService.completeProfile(userId, updateData);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const userObj = user.toObject();
    const { password, ...result } = userObj;
    return result;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const canRequest = await this.usersService.canRequestReset(email);
    if (!canRequest) {
      return { message: 'If the email exists, a reset link will be sent' };
    }

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { message: 'If the email exists, a reset link will be sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersService.setPasswordResetToken(email, hashedToken, expires);
    await this.emailService.sendPasswordResetEmail(email, resetToken, user.fullName);

    return { message: 'If the email exists, a reset link will be sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await this.usersService.findByResetToken(hashedToken);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      throw new BadRequestException('New password cannot be the same as the old password');
    }

    if (user.passwordHistory?.length > 0) {
      for (const oldHash of user.passwordHistory) {
        const isInHistory = await bcrypt.compare(newPassword, oldHash);
        if (isInHistory) {
          throw new BadRequestException('Cannot reuse a previous password');
        }
      }
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.resetPassword(user._id, hashedNewPassword, user.password);
    await this.emailService.sendPasswordResetConfirmation(user.email, user.fullName);

    return { message: 'Password reset successful' };
  }

  async googleLogin(googleUser: {
    email: string;
    fullName: string;
    userPhoto?: string;
    googleId: string;
  }) {
    const { email, fullName, userPhoto, googleId } = googleUser;
    
    // Check if user exists
    let user = await this.usersService.findByEmail(email);
    
    if (user) {
      // Existing user - link Google account if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = user.password ? 'hybrid' : 'google';
      }
      
      // Update profile photo if not set
      if (userPhoto && !user.userPhoto) {
        user.userPhoto = userPhoto;
      }
      
      await user.save();
    } else {
      // New user - create with OAuth data
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = await this.usersService.createOAuthUser({
        email,
        password: hashedPassword,
        fullName,
        userPhoto,
        googleId,
        authProvider: 'google',
      });
    }
    
    return this.generateAuthResponse(user);
  }

  private generateAuthResponse(user: any) {
    const userObj = user.toObject();
    const { password, ...result } = userObj;
    
    const payload = {
      email: user.email,
      sub: user._id,
      role: user.role,
      profileCompleted: user.profileCompleted || false
    };
    
    return {
      user: result,
      access_token: this.jwtService.sign(payload),
    };
  }
}