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
import { MultiChannelDeliveryService } from './multi-channel-delivery.service';
import { OfflineQueueService } from './delivery/offline-queue.service';
import { DeviceTokenManagementService } from './device-token-management.service';
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
@Controller('api/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly multiChannelDeliveryService: MultiChannelDeliveryService,
    private readonly offlineQueueService: OfflineQueueService,
    private readonly deviceTokenManagementService: DeviceTokenManagementService,
  ) {}

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
    const convertedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };
    return this.notificationsService.findAll(convertedFilters, pagination);
  }

  @Get('my')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiResponse({ status: 200, description: 'User notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findMy(@Request() req, @Query() filters: Omit<NotificationFiltersDto, 'userId'>) {
    const convertedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };
    return this.notificationsService.findByUserId(req.user.id, convertedFilters);
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

  @Get('queue/stats')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get offline queue statistics for current user' })
  @ApiResponse({ status: 200, description: 'Queue stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getQueueStats(@Request() req) {
    return this.offlineQueueService.getQueueStats(req.user.id);
  }

  @Get('queue/pending')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get pending notifications from offline queue' })
  @ApiResponse({ status: 200, description: 'Pending notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPendingNotifications(@Request() req) {
    return this.offlineQueueService.deliverQueuedNotifications(req.user.id);
  }

  @Get('delivery/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get multi-channel delivery statistics' })
  @ApiResponse({ status: 200, description: 'Delivery stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDeliveryStats() {
    return this.multiChannelDeliveryService.getDeliveryStats();
  }

  @Get('device-tokens/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get device token statistics' })
  @ApiResponse({ status: 200, description: 'Device token stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDeviceTokenStats() {
    return this.deviceTokenManagementService.getTokenStats();
  }

  @Delete('device-tokens/:tokenId')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Deactivate a device token' })
  @ApiResponse({ status: 200, description: 'Device token deactivated successfully' })
  @ApiResponse({ status: 404, description: 'Device token not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deactivateDeviceToken(@Param('tokenId') tokenId: string) {
    return this.deviceTokenManagementService.deactivateToken(tokenId);
  }

  @Delete('queue/clear')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Clear offline notification queue for current user' })
  @ApiResponse({ status: 200, description: 'Queue cleared successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async clearQueue(@Request() req) {
    return this.offlineQueueService.clearUserQueue(req.user.id);
  }

  @Get('analytics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get notification analytics' })
  @ApiQuery({ name: 'range', required: false, enum: ['7d', '30d', '90d'] })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnalytics(@Query('range') range: string = '7d') {
    return this.notificationsService.getAnalytics(range);
  }

  @Get('preferences')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  async getPreferences(@Request() req) {
    return this.notificationsService.getPreferences(req.user.id);
  }

  @Patch('preferences')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Update notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  async updatePreferences(@Request() req, @Body() body: any) {
    return this.notificationsService.updatePreferences(req.user.id, body.type, body.preferences);
  }

  @Patch('preferences/bulk')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  @ApiOperation({ summary: 'Bulk update notification preferences' })
  @ApiResponse({ status: 200, description: 'Bulk preferences updated successfully' })
  async updateBulkPreferences(@Request() req, @Body() body: { enabled: boolean }) {
    return this.notificationsService.updateBulkPreferences(req.user.id, body.enabled);
  }
}