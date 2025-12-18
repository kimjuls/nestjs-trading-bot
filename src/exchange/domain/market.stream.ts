import { Observable } from 'rxjs';
import { Candle } from '../dto/candle';
import { MarketTicker } from '../dto/market-ticker.dto';

export interface MarketStream {
  /**
   * Establish connection to the exchange's websocket feed.
   */
  connect(): Promise<void>;

  /**
   * Disconnect the stream.
   */
  disconnect(): Promise<void>;

  /**
   * Subscribe to specific market data streams.
   * Returns a standard Observable for reactive processing.
   */
  getRealtimeCandles(symbol: string, interval: string): Observable<Candle>;

  /**
   * Get real-time price updates (.e.g mark price).
   */
  getRealtimeTicker(symbol: string): Observable<MarketTicker>;
}
