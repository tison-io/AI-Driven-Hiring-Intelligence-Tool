import { Controller, Get, Delete, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PrivacyService } from './privacy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@ApiTags('Privacy & Data Protection')
@Controller('api/privacy')
export class PrivacyController {
  constructor(private privacyService: PrivacyService) {}

  @Get('policy')
  @ApiOperation({ summary: 'Get privacy policy content' })
  @ApiResponse({ status: 200, description: 'Privacy policy retrieved successfully' })
  async getPrivacyPolicy() {
    return this.privacyService.getPrivacyPolicy();
  }

  @Get('retention-policy')
  @ApiOperation({ summary: 'Get data retention policy' })
  @ApiResponse({ status: 200, description: 'Data retention policy retrieved successfully' })
  async getRetentionPolicy() {
    return this.privacyService.getRetentionPolicy();
  }

  @Get('export-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Export all user data (GDPR compliance)' })
  @ApiResponse({ status: 200, description: 'User data exported successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportUserData(@Request() req, @Res() res: Response) {
    const userData = await this.privacyService.exportUserData(req.user.id);
    
    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="user-data-${req.user.id}.json"`,
    });

    return res.send(userData);
  }

  @Delete('delete-data')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete all user data (Right to be forgotten)' })
  @ApiResponse({ status: 200, description: 'User data deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteUserData(@Request() req) {
    return this.privacyService.deleteUserData(req.user.id);
  }
}