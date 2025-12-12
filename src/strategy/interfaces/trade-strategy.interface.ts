import { Candle } from '../../exchange/dto/candle';
import { TradingSignal } from '../dto/trading-signal';

export interface TradeStrategy {
  /**
   * Analyze the market data(candles) and return a trading signal.
   */
  analyze(candles: Candle[]): Promise<TradingSignal>;

  /**
   * Optional: Initialize the strategy (e.g. load indicators).
   */
  onInit?(): Promise<void>;
}
