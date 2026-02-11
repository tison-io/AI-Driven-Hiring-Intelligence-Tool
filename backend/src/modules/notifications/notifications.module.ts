import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { Notification, NotificationSchema } from './entities/notification.entity';
import { DeviceToken, DeviceTokenSchema } from './entities/device-token.entity';
import { User, UserSchema } from '../users/entities/user.entity';
import { Candidate, CandidateSchema } from '../candidates/entities/candidate.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationGateway } from './notification.gateway';
import { RedisConnectionService } from './redis-connection.service';
import { NotificationBroadcastService } from './notification-broadcast.service';
import { ConnectionStateService } from './connection-state.service';
import { ReconnectionService } from './reconnection.service';
import { ConnectionHealthService } from './connection-health.service';
import { NotificationEventService } from './notification-event.service';
import { EmailDeliveryService } from './delivery/email-delivery.service';
import { WebPushDeliveryService } from './delivery/web-push-delivery.service';
import { OfflineQueueService } from './delivery/offline-queue.service';
import { DeviceTokenManagementService } from './device-token-management.service';
import { NotificationFormattingService } from './notification-formatting.service';
import { MultiChannelDeliveryService } from './multi-channel-delivery.service';
import { MonthlyAnalyticsService } from './automation/monthly-analytics.service';
import { MilestoneDetectionService } from './automation/milestone-detection.service';
import { PerformanceMonitoringService } from './automation/performance-monitoring.service';
import { AutomationTestService } from './automation/automation-test.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
      { name: User.name, schema: UserSchema },
      { name: Candidate.name, schema: CandidateSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 notifications per minute
    }]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService, 
    NotificationGateway, 
    RedisConnectionService,
    NotificationBroadcastService,
    ConnectionStateService,
    ReconnectionService,
    ConnectionHealthService,
    NotificationEventService,
    EmailDeliveryService,
    WebPushDeliveryService,
    OfflineQueueService,
    DeviceTokenManagementService,
    NotificationFormattingService,
    MultiChannelDeliveryService,
    MonthlyAnalyticsService,
    MilestoneDetectionService,
    PerformanceMonitoringService,
    AutomationTestService,
  ],
  exports: [
    NotificationsService, 
    NotificationGateway, 
    RedisConnectionService,
    NotificationBroadcastService,
    ConnectionStateService,
    ReconnectionService,
    ConnectionHealthService,
    NotificationEventService,
    EmailDeliveryService,
    WebPushDeliveryService,
    OfflineQueueService,
    DeviceTokenManagementService,
    NotificationFormattingService,
    MultiChannelDeliveryService,
    MonthlyAnalyticsService,
    MilestoneDetectionService,
    PerformanceMonitoringService,
    AutomationTestService,
  ],
})
export class NotificationsModule {}