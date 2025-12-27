import { MACD } from 'technicalindicators';
import { Candle } from '../../exchange/dto/candle';
import { TradingSignal } from '../dto/trading-signal';
import { TradeStrategy } from '../interfaces/trade-strategy.interface';
import { TradingAction } from '../enums/trading-action.enum';

export class MacdHistogramStrategy implements TradeStrategy {
  private readonly macdInput = {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  };

  private macd: MACD;
  private lastProcessedTime = 0;
  private results: any[] = []; // MACDOutput

  async onInit(): Promise<void> {
    this.macd = new MACD({
      values: [],
      ...this.macdInput,
    });
    this.lastProcessedTime = 0;
    this.results = [];
  }

  async analyze(candles: Candle[]): Promise<TradingSignal> {
    if (!this.macd) {
      await this.onInit();
    }

    // Incremental Update
    const newCandles = candles.filter(
      (c) => c.timestamp > this.lastProcessedTime,
    );
    if (newCandles.length > 0) {
      for (const candle of newCandles) {
        const val = this.macd.nextValue(candle.close);
        if (val) {
          this.results.push(val);
        }
      }
      this.lastProcessedTime = newCandles[newCandles.length - 1].timestamp;
    }

    const latestCandle = candles[candles.length - 1];

    // Default Signal
    const signal: TradingSignal = {
      action: TradingAction.Hold,
      price: latestCandle.close,
      timestamp: latestCandle.timestamp,
    };

    const results = this.results;

    if (results.length < 3) {
      return signal;
    }

    // Get last 3 histograms
    // t: current (completed)
    // t-1: previous
    // t-2: the one before previous
    const current = results[results.length - 1];
    const prev1 = results[results.length - 2];
    const prev2 = results[results.length - 3];

    if (
      !current ||
      !prev1 ||
      !prev2 ||
      current.histogram === undefined ||
      prev1.histogram === undefined ||
      prev2.histogram === undefined
    ) {
      return signal;
    }

    const hCurrent = current.histogram;
    const hPrev1 = prev1.histogram;
    const hPrev2 = prev2.histogram;

    // Logic 1: Long Entry (Valley)
    // Territory: All negative (or at least previous valley was negative)
    // Strictly speaking, user said "histogram < 0".
    // Pattern: Down(hPrev2 -> hPrev1) -> Up(hPrev1 -> hCurrent)
    if (hCurrent < 0 && hPrev1 < 0 && hPrev2 < 0) {
      if (hPrev2 > hPrev1 && hPrev1 < hCurrent) {
        signal.action = TradingAction.EnterLong;
        signal.metadata = {
          reason: 'MACD Histogram Valley (Reversal Up)',
          histogram: hCurrent,
        };
      }
    }

    // Logic 2: Short Entry (Peak)
    // Territory: All positive
    // Pattern: Up(hPrev2 -> hPrev1) -> Down(hPrev1 -> hCurrent)
    else if (hCurrent > 0 && hPrev1 > 0 && hPrev2 > 0) {
      if (hPrev2 < hPrev1 && hPrev1 > hCurrent) {
        signal.action = TradingAction.EnterShort;
        signal.metadata = {
          reason: 'MACD Histogram Peak (Reversal Down)',
          histogram: hCurrent,
        };
      }
    }

    return signal;
  }
}
