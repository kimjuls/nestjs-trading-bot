import { Test, TestingModule } from '@nestjs/testing';
import { MacdHistogramStrategy } from './macd-histogram.strategy';
import { Candle } from '../../exchange/dto/candle';
import { TradingAction } from '../enums/trading-action.enum';
import { MACD } from 'technicalindicators';

jest.mock('technicalindicators', () => {
  return {
    MACD: jest.fn().mockImplementation(() => ({
      nextValue: jest.fn(),
      getResult: jest.fn(),
    })),
  };
});

describe('MacdHistogramStrategy', () => {
  let strategy: MacdHistogramStrategy;
  let mockMACD: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MacdHistogramStrategy],
    }).compile();

    strategy = module.get<MacdHistogramStrategy>(MacdHistogramStrategy);
    await strategy.onInit();
    mockMACD = (strategy as any).macd;
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  const createCandle = (close: number, timestamp: number): Candle => ({
    symbol: 'BTCUSDT',
    interval: '15m',
    open: 100,
    high: 100,
    low: 100,
    close,
    volume: 1000,
    timestamp,
    isFinal: true,
  });

  // Helper to mock MACD nextValue
  const mockNextValue = (data: any[]) => {
    let callCount = 0;
    // Length of candles is 3 in these tests, not 60.
    // So we can map it directly.
    mockMACD.nextValue.mockImplementation(() => {
      const index = callCount++;
      // If data is provided, use it.
      if (index < data.length) return data[index];
      return { histogram: 0 };
    });
  };

  it('should return HOLD if not enough data', async () => {
    mockNextValue([]);
    const candles = [createCandle(100, 1000)];
    const signal = await strategy.analyze(candles);
    expect(signal.action).toBe(TradingAction.Hold);
  });

  it('should detect Long Entry (Valley) when histogram reverses from down to up in negative territory', async () => {
    // Histogram: -5 -> -10 -> -8 (Valley at -10)
    // t-2: -5 (decreasing)
    // t-1: -10 (lowest)
    // t: -8 (increasing, but still < 0)

    mockNextValue([{ histogram: -5 }, { histogram: -10 }, { histogram: -8 }]);

    const candles = [
      createCandle(100, 1000),
      createCandle(100, 2000),
      createCandle(100, 3000), // Latest
    ];

    const signal = await strategy.analyze(candles);

    expect(signal.action).toBe(TradingAction.EnterLong);
    expect(signal.metadata?.reason).toContain('Valley');
    expect(signal.metadata?.histogram).toBe(-8);
  });

  it('should detect Short Entry (Peak) when histogram reverses from up to down in positive territory', async () => {
    // Histogram: 5 -> 10 -> 8 (Peak at 10)
    // t-2: 5 (increasing)
    // t-1: 10 (highest)
    // t: 8 (decreasing, but still > 0)

    mockNextValue([{ histogram: 5 }, { histogram: 10 }, { histogram: 8 }]);

    const candles = [
      createCandle(100, 1000),
      createCandle(100, 2000),
      createCandle(100, 3000),
    ];

    const signal = await strategy.analyze(candles);

    expect(signal.action).toBe(TradingAction.EnterShort);
    expect(signal.metadata?.reason).toContain('Peak');
  });

  it('should return HOLD if trend continues without reversal', async () => {
    // Continuing down: -5 -> -8 -> -10
    mockNextValue([{ histogram: -5 }, { histogram: -8 }, { histogram: -10 }]);

    const candles = [
      createCandle(100, 1000),
      createCandle(100, 2000),
      createCandle(100, 3000),
    ];
    const signal = await strategy.analyze(candles);

    expect(signal.action).toBe(TradingAction.Hold);
  });
});
