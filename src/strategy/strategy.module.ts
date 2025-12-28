import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExchangeModule } from '../exchange/exchange.module';
import { RiskModule } from '../risk/risk.module';
import { ExecutionModule } from '../execution/execution.module';
import { StrategyFactory } from './application/strategy.factory';

@Module({
  imports: [ConfigModule, ExchangeModule, RiskModule, ExecutionModule],
  providers: [
    StrategyFactory,
    {
      provide: 'TradeStrategy',
      inject: [ConfigService, StrategyFactory],
      useFactory: (config: ConfigService, strategyFactory: StrategyFactory) => {
        const strategyName =
          config.get<string>('TRADING_STRATEGY') || 'MACD_HISTOGRAM';
        return strategyFactory.getStrategy(strategyName);
      },
    },
  ],
  exports: ['TradeStrategy', StrategyFactory],
})
export class StrategyModule {}
