import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  NotificationFiltersDto,
  PaginationDto,
  BulkMarkReadDto,
  DeviceTokenDto,
} from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({ status: 201, description: 'Notification created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid notification data or unauthorized type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createNotificationDto: CreateNotificationDto, @Request() req) {
    return this.notificationsService.create(createNotificationDto, req.user.role);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get all notifications with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() filters: NotificationFiltersDto, @Query() pagination: PaginationDto) {
    return this.notificationsService.findAll(filters, pagination);
  }

  @Get('my')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiResponse({ status: 200, description: 'User notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMy(@Request() req, @Query() filters: Omit<NotificationFiltersDto, 'userId'>) {
    return this.notificationsService.findByUserId(req.user.id, filters);
  }

  @Get('unread-count')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Get('unread-count-by-type')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get unread notification count grouped by type' })
  @ApiResponse({ status: 200, description: 'Unread counts by type retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCountByType(@Request() req) {
    return this.notificationsService.getUnreadCountByType(req.user.id);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Search notifications by title and content' })
  @ApiQuery({ name: 'q', description: 'Search term', required: true })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async search(
    @Query('q') searchTerm: string,
    @Query() pagination: PaginationDto,
    @Request() req
  ) {
    return this.notificationsService.search(searchTerm, req.user.id, pagination);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string) {
    return this.notificationsService.findById(id);
  }

  @Patch(':id/read')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch(':id/unread')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Mark notification as unread' })
  @ApiResponse({ status: 200, description: 'Notification marked as unread' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAsUnread(@Param('id') id: string) {
    return this.notificationsService.markAsUnread(id);
  }

  @Patch('mark-all-read')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch('mark-multiple-read')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiResponse({ status: 200, description: 'Multiple notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markMultipleAsRead(@Body() bulkMarkReadDto: BulkMarkReadDto) {
    return this.notificationsService.markMultipleAsRead(bulkMarkReadDto.notificationIds);
  }

  @Delete('multiple')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Delete multiple notifications' })
  @ApiResponse({ status: 200, description: 'Multiple notifications deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteMultiple(@Body() bulkMarkReadDto: BulkMarkReadDto) {
    return this.notificationsService.deleteMultiple(bulkMarkReadDto.notificationIds);
  }

  @Post('device-token')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Save device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device token saved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid device token data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async saveDeviceToken(@Body() deviceTokenDto: DeviceTokenDto, @Request() req) {
    return this.notificationsService.saveDeviceToken(
      req.user.id,
      deviceTokenDto.token,
      deviceTokenDto.platform,
      deviceTokenDto.userAgent
    );
  }

  @Get('device-tokens/active')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get active device tokens for current user' })
  @ApiResponse({ status: 200, description: 'Active device tokens retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActiveDeviceTokens(@Request() req) {
    return this.notificationsService.getActiveDeviceTokens(req.user.id);
  }
}