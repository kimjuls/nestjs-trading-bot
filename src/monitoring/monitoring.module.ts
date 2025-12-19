import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DiscordNotificationService } from './infrastructure/discord-notification.service';
import { GlobalExceptionFilter } from './infrastructure/global-exception.filter';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'NotificationService',
      useClass: DiscordNotificationService,
    },
    DiscordNotificationService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  exports: ['NotificationService', DiscordNotificationService],
})
export class MonitoringModule {}
