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
  private macdResults: any[] = [];
  private rsiResults: number[] = [];

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
    this.macdResults = [];
    this.rsiResults = [];
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
        const mVal = this.macd.nextValue(candle.close);
        if (mVal) this.macdResults.push(mVal);

        const rVal = this.rsi.nextValue(candle.close);
        if (rVal !== undefined) this.rsiResults.push(rVal);
      }
      this.lastProcessedTime = newCandles[newCandles.length - 1].timestamp;
    }

    const latestCandle = candles[candles.length - 1];

    const macdResults = this.macdResults;
    const rsiResults = this.rsiResults;

    const lastIndex = macdResults.length - 1;
    const prevIndex = macdResults.length - 2;

    let signal: TradingSignal = {
      action: TradingAction.Hold,
      price: latestCandle.close,
      timestamp: latestCandle.timestamp,
    };

    if (lastIndex < 1 || rsiResults.length < 1) {
      return signal;
    }

    const currentMacd = macdResults[lastIndex];
    const prevMacd = macdResults[prevIndex];
    const currentRsi = rsiResults[rsiResults.length - 1];

    if (
      currentMacd?.MACD === undefined ||
      currentMacd?.signal === undefined ||
      prevMacd?.MACD === undefined ||
      prevMacd?.signal === undefined
    ) {
      return signal;
    }

    // Check Crossovers
    // Golden Cross: Previous MACD <= Previous Signal AND Current MACD > Current Signal
    const isGoldenCross =
      prevMacd.MACD <= prevMacd.signal && currentMacd.MACD > currentMacd.signal;

    // Dead Cross: Previous MACD >= Previous Signal AND Current MACD < Current Signal
    const isDeadCross =
      prevMacd.MACD >= prevMacd.signal && currentMacd.MACD < currentMacd.signal;

    if (isGoldenCross) {
      // Logic 1: Long Entry (Takes precedence)
      // MACD Golden Cross AND RSI < 70
      if (currentRsi < 70) {
        signal.action = TradingAction.EnterLong;
        signal.metadata = {
          reason: 'MACD Golden Cross + RSI < 70',
          macd: currentMacd,
          rsi: currentRsi,
        };
      } else {
        // Logic 4: Short Exit
        // MACD Golden Cross (implied RSI >= 70 or just Golden Cross in general if we were Short)
        signal.action = TradingAction.ExitShort;
        signal.metadata = {
          reason: 'MACD Golden Cross',
          macd: currentMacd,
          rsi: currentRsi,
        };
      }
    } else if (isDeadCross) {
      // Logic 2: Short Entry (Takes precedence)
      // MACD Dead Cross AND RSI > 30
      if (currentRsi > 30) {
        signal.action = TradingAction.EnterShort;
        signal.metadata = {
          reason: 'MACD Dead Cross + RSI > 30',
          macd: currentMacd,
          rsi: currentRsi,
        };
      } else {
        // Logic 3: Long Exit
        // MACD Dead Cross
        signal.action = TradingAction.ExitLong;
        signal.metadata = {
          reason: 'MACD Dead Cross',
          macd: currentMacd,
          rsi: currentRsi,
        };
      }
    }

    return signal;
  }
}
