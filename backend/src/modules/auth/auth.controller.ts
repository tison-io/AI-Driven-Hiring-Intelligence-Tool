import { Controller, Post, Body, Get, Put, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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
}