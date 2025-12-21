import { Candle } from '../../exchange/dto/candle';

export interface HistoricalDataLoader {
  /**
   * Load candles for a specific symbol and interval within a date range.
   */
  loadCandles(
    symbol: string,
    interval: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Candle[]>;
}
