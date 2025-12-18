import { MacdRsiStrategy } from './macd-rsi.strategy';
import { Candle } from '../../exchange/dto/candle';
import { TradingAction } from '../enums/trading-action.enum';
import { MACD, RSI } from 'technicalindicators';

jest.mock('technicalindicators', () => ({
  MACD: {
    calculate: jest.fn(),
  },
  RSI: {
    calculate: jest.fn(),
  },
}));

describe('MacdRsiStrategy', () => {
  let strategy: MacdRsiStrategy;
  let candles: Candle[];

  beforeEach(() => {
    strategy = new MacdRsiStrategy();
    // Create dummy candles (length 60 to pass length check)
    candles = Array.from({ length: 60 }, (_, i) => ({
      close: 100 + i,
      timestamp: 1000 + i,
      open: 100,
      high: 110,
      low: 90,
      volume: 1000,
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockIndicators = (
    prevMacd: { MACD: number; signal: number },
    currMacd: { MACD: number; signal: number },
    rsiValue: number,
  ) => {
    (MACD.calculate as jest.Mock).mockReturnValue([
      ...Array(58).fill({ MACD: 0, signal: 0, histogram: 0 }),
      { ...prevMacd, histogram: 0 },
      { ...currMacd, histogram: 0 },
    ]);
    (RSI.calculate as jest.Mock).mockReturnValue([
      ...Array(59).fill(50),
      rsiValue,
    ]);
  };

  it('should return ENTER_LONG when Golden Cross and RSI < 70', async () => {
    // Golden Cross: Prev (MACD < Signal), Curr (MACD > Signal)
    // RSI: 60 (< 70)
    mockIndicators(
      { MACD: 10, signal: 15 }, // Prev: 10 < 15
      { MACD: 20, signal: 15 }, // Curr: 20 > 15
      60,
    );

    const signal = await strategy.analyze(candles);

    expect(signal.action).toBe(TradingAction.EnterLong);
    expect(signal.metadata?.reason).toContain('MACD Golden Cross + RSI < 70');
  });

  it('should return EXIT_SHORT when Golden Cross occurs', async () => {
    // Golden Cross: Prev (MACD < Signal), Curr (MACD > Signal)
    // RSI: 80 (Over 70, so NOT Entry, but still Golden Cross means Exit Short)
    mockIndicators({ MACD: 10, signal: 15 }, { MACD: 20, signal: 15 }, 80);

    const signal = await strategy.analyze(candles);

    // Note: In current logic, ENTER_LONG has precedence?
    // Let's check logic order:
    // 1. Long Entry (Golden Cross && RSI < 70)
    // 2. Short Entry ...
    // 3. Long Exit (Dead Cross)
    // 4. Short Exit (Golden Cross)

    // If RSI is 80, Long Entry condition fails.
    // Short Entry condition fails (Dead Cross needed).
    // Long Exit condition fails (Dead Cross needed).
    // Short Exit condition matches (Golden Cross).

    expect(signal.action).toBe(TradingAction.ExitShort);
    expect(signal.metadata?.reason).toBe('MACD Golden Cross');
  });

  it('should return ENTER_SHORT when Dead Cross and RSI > 30', async () => {
    // Dead Cross: Prev (MACD > Signal), Curr (MACD < Signal)
    // RSI: 40 (> 30)
    mockIndicators(
      { MACD: 20, signal: 15 }, // Prev: 20 > 15
      { MACD: 10, signal: 15 }, // Curr: 10 < 15
      40,
    );

    const signal = await strategy.analyze(candles);

    expect(signal.action).toBe(TradingAction.EnterShort);
    expect(signal.metadata?.reason).toContain('MACD Dead Cross + RSI > 30');
  });

  it('should return EXIT_LONG when Dead Cross occurs', async () => {
    // Dead Cross: Prev (MACD > Signal), Curr (MACD < Signal)
    // RSI: 20 (Below 30, so NOT Short Entry, but Dead Cross means Exit Long)
    mockIndicators({ MACD: 20, signal: 15 }, { MACD: 10, signal: 15 }, 20);

    const signal = await strategy.analyze(candles);

    // Logic Order:
    // 1. Long Entry (GC...) -> Fail
    // 2. Short Entry (DC && RSI > 30) -> Fail (RSI 20)
    // 3. Long Exit (DC) -> Match

    expect(signal.action).toBe(TradingAction.ExitLong);
    expect(signal.metadata?.reason).toBe('MACD Dead Cross');
  });

  it('should return HOLD when no crossover', async () => {
    // No Cross: Prev (MACD > Signal), Curr (MACD > Signal)
    mockIndicators({ MACD: 20, signal: 15 }, { MACD: 22, signal: 15 }, 50);

    const signal = await strategy.analyze(candles);

    expect(signal.action).toBe(TradingAction.Hold);
  });
});
