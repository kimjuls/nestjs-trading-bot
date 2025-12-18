export class Candle {
  symbol: string;
  interval: string;
  isFinal: boolean;

  /**
   * Opening price of the interval.
   */
  open: number;

  /**
   * Highest price of the interval.
   */
  high: number;

  /**
   * Lowest price of the interval.
   */
  low: number;

  /**
   * Closing price of the interval.
   */
  close: number;

  /**
   * Volume traded during the interval.
   */
  volume: number;

  /**
   * Timestamp of the candle open time.
   */
  timestamp: number;
}
