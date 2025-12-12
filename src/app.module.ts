import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { ConfigModule } from './config/config.module';
import { ExchangeModule } from './exchange/exchange.module';
import { StrategyModule } from './strategy/strategy.module';
import { RiskModule } from './risk/risk.module';
import { ExecutionModule } from './execution/execution.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { CommonModule } from './common/common.module';

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
export class AppModule {}
