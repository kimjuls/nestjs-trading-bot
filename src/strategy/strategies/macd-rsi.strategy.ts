import { MACD, RSI } from 'technicalindicators';
import { Candle } from '../../exchange/dto/candle';
import { TradingSignal } from '../dto/trading-signal';
import { TradeStrategy } from '../interfaces/trade-strategy.interface';
import { TradingAction } from '../enums/trading-action.enum';

export class MacdRsiStrategy implements TradeStrategy {
  private readonly macdInput = {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  };

  private readonly rsiInput = {
    period: 14,
  };

  private macd: MACD;
  private rsi: RSI;
  private lastProcessedTime = 0;

  async onInit(): Promise<void> {
    this.macd = new MACD({
      values: [],
      ...this.macdInput,
    });
    this.rsi = new RSI({
      values: [],
      ...this.rsiInput,
    });
    this.lastProcessedTime = 0;
  }

  async analyze(candles: Candle[]): Promise<TradingSignal> {
    if (!this.macd || !this.rsi) {
      await this.onInit();
    }

    // Incremental Update Logic
    // Find candles that have not been processed yet
    const newCandles = candles.filter(
      (c) => c.timestamp > this.lastProcessedTime,
    );

    if (newCandles.length > 0) {
      for (const candle of newCandles) {
        this.macd.nextValue(candle.close);
        this.rsi.nextValue(candle.close);
      }
      this.lastProcessedTime = newCandles[newCandles.length - 1].timestamp;
    }

    const latestCandle = candles[candles.length - 1];

    // Need enough data
    // MACD result might be undefined initially
    // We can access results via this.macd.getResult() which might return the full array?
    // No, technicalindicators usually stores result.
    // Actually, checking library behavior: classes usually behave as streams but 'getResult()' isn't always standard or efficient if it returns full array.
    // But usually we just need the LAST result.
    // Warning: `technicalindicators` stateful classes store result in `result` property (array).
    // Accessing the last element of the array is O(1).

    const macdResults = this.macd.getResult();
    const rsiResults = this.rsi.getResult();

    const lastIndex = macdResults.length - 1;
    const prevIndex = macdResults.length - 2;

    if (lastIndex < 1 || rsiResults.length < 1) {
      return this.createSignal(TradingAction.Hold, latestCandle);
    }

    const currentMacd = macdResults[lastIndex];
    const prevMacd = macdResults[prevIndex];
    const currentRsi = rsiResults[rsiResults.length - 1];

    if (
      !currentMacd ||
      !prevMacd ||
      currentMacd.MACD === undefined ||
      currentMacd.signal === undefined ||
      prevMacd.MACD === undefined ||
      prevMacd.signal === undefined
    ) {
      return this.createSignal(TradingAction.Hold, latestCandle);
    }

    // Check Crossovers
    // Golden Cross: Previous MACD <= Previous Signal AND Current MACD > Current Signal
    const isGoldenCross =
      prevMacd.MACD <= prevMacd.signal && currentMacd.MACD > currentMacd.signal;

    // Dead Cross: Previous MACD >= Previous Signal AND Current MACD < Current Signal
    const isDeadCross =
      prevMacd.MACD >= prevMacd.signal && currentMacd.MACD < currentMacd.signal;

    // Logic 1: Long Entry
    // MACD Golden Cross AND RSI < 70
    if (isGoldenCross && currentRsi < 70) {
      return this.createSignal(TradingAction.EnterLong, latestCandle, {
        reason: 'MACD Golden Cross + RSI < 70',
        macd: currentMacd,
        rsi: currentRsi,
      });
    }

    // Logic 2: Short Entry
    // MACD Dead Cross AND RSI > 30
    if (isDeadCross && currentRsi > 30) {
      return this.createSignal(TradingAction.EnterShort, latestCandle, {
        reason: 'MACD Dead Cross + RSI > 30',
        macd: currentMacd,
        rsi: currentRsi,
      });
    }

    // Logic 3: Long Exit
    if (isDeadCross) {
      return this.createSignal(TradingAction.ExitLong, latestCandle, {
        reason: 'MACD Dead Cross',
        macd: currentMacd,
        rsi: currentRsi,
      });
    }

    // Logic 4: Short Exit
    if (isGoldenCross) {
      return this.createSignal(TradingAction.ExitShort, latestCandle, {
        reason: 'MACD Golden Cross',
        macd: currentMacd,
        rsi: currentRsi,
      });
    }

    return this.createSignal(TradingAction.Hold, latestCandle, {
      macd: currentMacd,
      rsi: currentRsi,
    });
  }

  private createSignal(
    action: TradingAction,
    candle: Candle,
    metadata?: Record<string, any>,
  ): TradingSignal {
    return {
      action,
      price: candle.close,
      timestamp: candle.timestamp,
      metadata,
    };
  }
}
