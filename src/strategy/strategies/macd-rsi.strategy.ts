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

  async analyze(candles: Candle[]): Promise<TradingSignal> {
    const closePrices = candles.map((c) => c.close);

    // Need enough data for indicators
    // MACD needs at least slowPeriod + signalPeriod - 1?
    // Safer to check for a reasonable amount.
    if (candles.length < 50) {
      return this.createSignal(TradingAction.Hold, candles[candles.length - 1]);
    }

    const macdResult = MACD.calculate({
      values: closePrices,
      ...this.macdInput,
    });

    const rsiResult = RSI.calculate({
      values: closePrices,
      ...this.rsiInput,
    });

    // We need the last two MACD values to check for crossover
    // macdResult is an array of MACDOutput: { MACD?: number, signal?: number, histogram?: number }
    // The result array might be shorter than candles because of the lookback period.
    // We strictly look at the LATEST completed candle (last index).

    const lastIndex = macdResult.length - 1;
    const prevIndex = macdResult.length - 2;

    if (lastIndex < 1 || rsiResult.length < 1) {
      return this.createSignal(TradingAction.Hold, candles[candles.length - 1]);
    }

    const currentMacd = macdResult[lastIndex];
    const prevMacd = macdResult[prevIndex];

    // RSI array length might differ slightly depending on calculation start
    // We want the RSI corresponding to the SAME time as currentMacd.
    // Usually technicalindicators aligns results. Let's assume the last element is the latest.
    const currentRsi = rsiResult[rsiResult.length - 1];

    if (
      !currentMacd ||
      !prevMacd ||
      currentMacd.MACD === undefined ||
      currentMacd.signal === undefined ||
      prevMacd.MACD === undefined ||
      prevMacd.signal === undefined
    ) {
      return this.createSignal(TradingAction.Hold, candles[candles.length - 1]);
    }

    // Check Crossovers
    // Golden Cross: Previous MACD < Previous Signal AND Current MACD > Current Signal
    const isGoldenCross =
      prevMacd.MACD <= prevMacd.signal && currentMacd.MACD > currentMacd.signal;

    // Dead Cross: Previous MACD > Previous Signal AND Current MACD < Current Signal
    const isDeadCross =
      prevMacd.MACD >= prevMacd.signal && currentMacd.MACD < currentMacd.signal;

    const latestCandle = candles[candles.length - 1];

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

    // Logic 3: Long Exit (Trend Reversal)
    // MACD Dead Cross
    if (isDeadCross) {
      return this.createSignal(TradingAction.ExitLong, latestCandle, {
        reason: 'MACD Dead Cross',
        macd: currentMacd,
        rsi: currentRsi,
      });
    }

    // Logic 4: Short Exit (Trend Reversal)
    // MACD Golden Cross
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
