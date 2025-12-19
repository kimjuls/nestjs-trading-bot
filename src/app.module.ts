import { Module, OnApplicationBootstrap, Inject, Logger } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { ConfigModule } from './config/config.module';
import { ExchangeModule } from './exchange/exchange.module';
import { StrategyModule } from './strategy/strategy.module';
import { RiskModule } from './risk/risk.module';
import { ExecutionModule } from './execution/execution.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { CommonModule } from './common/common.module';
import { NotificationService } from './monitoring/domain/notification.service.interface';
import { ExchangeClient } from './exchange/domain/exchange.client';

@Module({
  imports: [
    // Configuration
    ConfigModule, // Internally calls .forRoot()
    ScheduleModule.forRoot(),

    // Domain Modules
    ExchangeModule,
    StrategyModule,
    RiskModule,
    ExecutionModule,
    MonitoringModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    @Inject('ExchangeClient') private readonly exchangeClient: ExchangeClient,
    @Inject('NotificationService')
    private readonly notificationService: NotificationService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Application has started. Sending startup notification...');
    try {
      const positions = await this.exchangeClient.getPositions();
      const balances = await this.exchangeClient.getBalance();

      await this.notificationService.sendStartupNotification(
        positions,
        balances,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send startup notification: ${error.message}`,
        error,
      );
    }
  }
}
