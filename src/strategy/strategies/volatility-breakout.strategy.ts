import { TradeStrategy } from '../interfaces/trade-strategy.interface';
import { Candle } from '../../exchange/dto/candle';
import { TradingSignal } from '../dto/trading-signal';
import { TradingAction } from '../enums/trading-action.enum';

export class VolatilityBreakoutStrategy implements TradeStrategy {
  private readonly K = 0.5;

  async analyze(candles: Candle[]): Promise<TradingSignal> {
    const latestCandle = candles[candles.length - 1];

    // Default Hold Signal
    const signal: TradingSignal = {
      action: TradingAction.Hold,
      price: latestCandle.close,
      timestamp: latestCandle.timestamp,
    };

    if (candles.length < 2) {
      return signal;
    }

    // Helper to get UTC date string YYYY-MM-DD
    const getDateStr = (ts: number) => new Date(ts).toISOString().split('T')[0];

    // Group candles by Day
    const todayStr = getDateStr(latestCandle.timestamp);
    const todayCandles = candles.filter(
      (c) => getDateStr(c.timestamp) === todayStr,
    );

    // We need yesterday data.
    // Assuming candles are sorted, we look for candles before today.
    const beforeTodayCandles = candles.filter(
      (c) => getDateStr(c.timestamp) < todayStr,
    );

    // Find the latest "Yesterday" date string effectively
    if (beforeTodayCandles.length === 0) {
      return signal;
    }
    const yesterdayStr = getDateStr(
      beforeTodayCandles[beforeTodayCandles.length - 1].timestamp,
    );
    const yesterdayCandles = beforeTodayCandles.filter(
      (c) => getDateStr(c.timestamp) === yesterdayStr,
    );

    if (yesterdayCandles.length === 0 || todayCandles.length === 0) {
      return signal;
    }

    // Calculate Yesterday's High/Low
    let prevHigh = -Infinity;
    let prevLow = Infinity;

    for (const c of yesterdayCandles) {
      if (c.high > prevHigh) prevHigh = c.high;
      if (c.low < prevLow) prevLow = c.low;
    }

    // Calculate Today's Open (First candle of today)
    // Assuming candles are sorted by timestamp
    const todayOpen = todayCandles[0].open;

    // Target Price determination
    const range = prevHigh - prevLow;
    const targetPrice = todayOpen + range * this.K;

    // Check condition
    if (latestCandle.close > targetPrice) {
      signal.action = TradingAction.EnterLong;
      signal.metadata = {
        reason: `Volatility Breakout: Price(${latestCandle.close}) > Target(${targetPrice}) [Open(${todayOpen}) + Range(${range}) * K(${this.K})]`,
        targetPrice,
        todayOpen,
        prevHigh,
        prevLow,
      };
    }

    return signal;
  }
}
