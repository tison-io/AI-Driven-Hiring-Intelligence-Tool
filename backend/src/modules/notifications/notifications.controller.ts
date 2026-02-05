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

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async create(@Body() createNotificationDto: CreateNotificationDto, @Request() req) {
    return this.notificationsService.create(createNotificationDto, req.user.role);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async findAll(@Query() filters: NotificationFiltersDto, @Query() pagination: PaginationDto) {
    return this.notificationsService.findAll(filters, pagination);
  }

  @Get('my')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async findMy(@Request() req, @Query() filters: Omit<NotificationFiltersDto, 'userId'>) {
    return this.notificationsService.findByUserId(req.user.id, filters);
  }

  @Get('unread-count')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Get('unread-count-by-type')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async getUnreadCountByType(@Request() req) {
    return this.notificationsService.getUnreadCountByType(req.user.id);
  }

  @Get('search')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async search(
    @Query('q') searchTerm: string,
    @Query() pagination: PaginationDto,
    @Request() req
  ) {
    return this.notificationsService.search(searchTerm, req.user.id, pagination);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async findOne(@Param('id') id: string) {
    return this.notificationsService.findById(id);
  }

  @Patch(':id/read')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch(':id/unread')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async markAsUnread(@Param('id') id: string) {
    return this.notificationsService.markAsUnread(id);
  }

  @Patch('mark-all-read')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch('mark-multiple-read')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async markMultipleAsRead(@Body() bulkMarkReadDto: BulkMarkReadDto) {
    return this.notificationsService.markMultipleAsRead(bulkMarkReadDto.notificationIds);
  }

  @Delete('multiple')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  async deleteMultiple(@Body() bulkMarkReadDto: BulkMarkReadDto) {
    return this.notificationsService.deleteMultiple(bulkMarkReadDto.notificationIds);
  }

  @Post('device-token')
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
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
  async getActiveDeviceTokens(@Request() req) {
    return this.notificationsService.getActiveDeviceTokens(req.user.id);
  }
}