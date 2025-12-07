import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
    const { password, ...result } = user;
    
    const payload = { email: user.email, sub: user._id, role: user.role, profileCompleted: user.profileCompleted || false };
    
    return {
      user: result,
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password, ...result } = user;
    const payload = { email: user.email, sub: user._id, role: user.role, profileCompleted: user.profileCompleted || false };
    
    return {
      user: result,
      access_token: this.jwtService.sign(payload),
    };
  }

  async changePassword(userId: string, changePasswordDto: any) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
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

    const { password, ...result } = user;
    return result;
  }

  async completeProfile(userId: string, profileData: any, userPhoto?: string, companyLogo?: string) {
    const updateData = {
      ...profileData,
      ...(userPhoto && { userPhoto }),
      ...(companyLogo && { companyLogo })
    };

    const user = await this.usersService.completeProfile(userId, updateData);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...result } = user;
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
}