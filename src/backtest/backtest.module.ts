import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StrategyModule } from '../strategy/strategy.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { BacktestEngine } from './application/backtest.engine';
import { BacktestPositionManager } from './application/backtest.position.manager';
import { BinanceHistoricalLoader } from './infrastructure/binance.historical.loader';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    MonitoringModule,
    StrategyModule,
  ],
  providers: [
    BacktestEngine,
    BacktestPositionManager,
    {
      provide: 'HistoricalDataLoader',
      useClass: BinanceHistoricalLoader,
    },
  ],
  exports: [BacktestEngine],
})
export class BacktestModule {}
