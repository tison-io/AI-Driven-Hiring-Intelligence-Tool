import { Controller, Post, Body, Get, Put, UseGuards, Request, UseInterceptors, UploadedFiles, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cloudinaryService: CloudinaryService
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new recruiter user' })
  @ApiResponse({ status: 201, description: 'Recruiter successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid password format or user exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req) {
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid current password' })
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }

  @Put('complete-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'userPhoto', maxCount: 1 },
    { name: 'companyLogo', maxCount: 1 }
  ]))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Complete user profile with optional file uploads' })
  @ApiResponse({ status: 200, description: 'Profile completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async completeProfile(
    @Request() req,
    @Body() completeProfileDto: CompleteProfileDto,
    @UploadedFiles() files?: { userPhoto?: Express.Multer.File[], companyLogo?: Express.Multer.File[] }
  ) {
    let userPhotoUrl: string | undefined;
    let companyLogoUrl: string | undefined;

    // Upload files to Cloudinary if provided
    if (files?.userPhoto?.[0]) {
      userPhotoUrl = await this.cloudinaryService.uploadImage(
        files.userPhoto[0],
        'user-photos'
      );
    }
    if (files?.companyLogo?.[0]) {
      companyLogoUrl = await this.cloudinaryService.uploadImage(
        files.companyLogo[0],
        'company-logos'
      );
    }

    return this.authService.completeProfile(
      req.user.id,
      completeProfileDto,
      userPhotoUrl,
      companyLogoUrl
    );
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: 'Request password reset (Rate limit: 3 per hour)' })
  @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password/:token')
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(
    @Param('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto
  ) {
    return this.authService.resetPassword(token, resetPasswordDto.newPassword);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ 
    summary: 'Initiate Google OAuth login',
    description: 'Redirects user to Google OAuth consent screen'
  })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth() {
    // Guard handles the redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ 
    summary: 'Google OAuth callback',
    description: 'Handles Google OAuth callback, creates session, and redirects to frontend'
  })
  @ApiResponse({ 
    status: 302, 
    description: 'Creates session and redirects to frontend dashboard or profile completion'
  })
  @ApiResponse({ status: 401, description: 'OAuth authentication failed' })
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    const googleUser = req.user;
    
    // Create or update user and get user data
    const user = await this.authService.googleLogin(googleUser);
    
    // Store user info in session
    req.session.userId = user._id.toString();
    req.session.email = user.email;
    req.session.role = user.role;
    req.session.profileCompleted = user.profileCompleted;
    
    // Redirect to frontend based on profile completion status
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const redirectUrl = user.profileCompleted 
      ? `${frontendUrl}/dashboard`
      : `${frontendUrl}/complete-profile`;
    
    return res.redirect(redirectUrl);
  }
}