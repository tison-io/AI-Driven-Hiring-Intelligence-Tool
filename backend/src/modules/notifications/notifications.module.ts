import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Notification, NotificationSchema } from './entities/notification.entity';
import { DeviceToken, DeviceTokenSchema } from './entities/device-token.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationGateway } from './notification.gateway';
import { RedisConnectionService } from './redis-connection.service';
import { NotificationBroadcastService } from './notification-broadcast.service';
import { ConnectionStateService } from './connection-state.service';
import { NotificationEventService } from './notification-event.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: DeviceToken.name, schema: DeviceTokenSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 notifications per minute
    }]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService, 
    NotificationGateway, 
    RedisConnectionService,
    NotificationBroadcastService,
    ConnectionStateService,
    NotificationEventService,
  ],
  exports: [
    NotificationsService, 
    NotificationGateway, 
    RedisConnectionService,
    NotificationBroadcastService,
    ConnectionStateService,
    NotificationEventService,
  ],
})
export class NotificationsModule {}