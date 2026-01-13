import { Controller, Post, Body, Get, Put, UseGuards, Request, UseInterceptors, UploadedFiles, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
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
    private cloudinaryService: CloudinaryService,
    private jwtService: JwtService,
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
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    
    // Set JWT in HTTP-only cookie
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    // Return user only (no token in response body)
    return { user: result.user };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear JWT cookie
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  @Get('session/validate')
  @ApiOperation({ 
    summary: 'Validate session',
    description: 'Checks if user has valid session and returns user data'
  })
  @ApiResponse({ status: 200, description: 'Session validation result' })
  async validateSession(@Request() req) {
    if (req.session?.userId) {
      try {
        const user = await this.authService.getProfile(req.session.userId);
        return { authenticated: true, user };
      } catch (error) {
        // User may have been deleted; invalidate stale session
             await new Promise<void>((resolve) => {
                 req.session.destroy((err) => {
                   if (err) {
                      console.error('Failed to destroy stale session:', err);
                   }
                   resolve();
                 });
              });
          
        // Consider checking error type before destroying session
        return { authenticated: false };
      }
    }
    return { authenticated: false };
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
    description: 'Handles Google OAuth callback, sets JWT cookie, and redirects to frontend'
  })
  @ApiResponse({ 
    status: 302, 
    description: 'Sets JWT cookie and redirects to frontend dashboard or profile completion'
  })
  @ApiResponse({ status: 401, description: 'OAuth authentication failed' })
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    try {
      const googleUser = req.user;
      const user = await this.authService.googleLogin(googleUser);
      
      // Generate JWT token
      const payload = { 
        email: user.email, 
        sub: user._id, 
        role: user.role, 
        profileCompleted: user.profileCompleted 
      };
      const access_token = this.jwtService.sign(payload);
      
      // Set JWT in HTTP-only cookie
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      // Redirect to frontend (no token in URL)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      const redirectUrl = user.profileCompleted 
        ? `${frontendUrl}/dashboard`
        : `${frontendUrl}/complete-profile`;
      
      return res.redirect(redirectUrl);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
      return res.redirect(`${frontendUrl}/auth/login?error=oauth_failed`);
    }
  }
}