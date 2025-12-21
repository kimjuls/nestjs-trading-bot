import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { DiscordNotificationService } from './infrastructure/discord-notification.service';
import { GlobalExceptionFilter } from './infrastructure/global-exception.filter';
import { RiskModule } from '../risk/risk.module';

@Global()
@Module({
  imports: [ConfigModule, RiskModule],
  providers: [
    {
      provide: 'NotificationService',
      useExisting: DiscordNotificationService,
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
