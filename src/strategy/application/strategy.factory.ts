import { Injectable } from '@nestjs/common';
import { MacdHistogramStrategy } from '../strategies/macd-histogram.strategy';
import { MacdRsiStrategy } from '../strategies/macd-rsi.strategy';
import { VolatilityBreakoutStrategy } from '../strategies/volatility-breakout.strategy';
import { TradeStrategy } from '../interfaces/trade-strategy.interface';

@Injectable()
export class StrategyFactory {
  getStrategy(name: string): TradeStrategy {
    switch (name) {
      case 'MACD_RSI':
        return new MacdRsiStrategy();
      case 'VOLATILITY_BREAKOUT':
        return new VolatilityBreakoutStrategy();
      case 'MACD_HISTOGRAM':
      default:
        // Log if unknown strategy is requested? defaulting to histogram for now as requested
        return new MacdHistogramStrategy();
    }
  }
}
