import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExchangeModule } from '../exchange/exchange.module';
import { RiskModule } from '../risk/risk.module';
import { ExecutionModule } from '../execution/execution.module';
import { MacdHistogramStrategy } from './strategies/macd-histogram.strategy';
import { MacdRsiStrategy } from './strategies/macd-rsi.strategy';

@Module({
  imports: [ConfigModule, ExchangeModule, RiskModule, ExecutionModule],
  providers: [
    MacdHistogramStrategy,
    MacdRsiStrategy,
    {
      provide: 'TradeStrategy',
      inject: [ConfigService, MacdHistogramStrategy, MacdRsiStrategy],
      useFactory: (
        config: ConfigService,
        macdHistogram: MacdHistogramStrategy,
        macdRsi: MacdRsiStrategy,
      ) => {
        const strategyName = config.get<string>('TRADING_STRATEGY');
        if (strategyName === 'MACD_RSI') {
          return macdRsi;
        }
        // Default to Histogram if not specified or specified as MACD_HISTOGRAM
        return macdHistogram;
      },
    },
  ],
  exports: ['TradeStrategy'],
})
export class StrategyModule {}
