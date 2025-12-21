import { MacdRsiStrategy } from './macd-rsi.strategy';
import { Candle } from '../../exchange/dto/candle';
import { TradingAction } from '../enums/trading-action.enum';

const mockMacdInstance = {
  nextValue: jest.fn(),
  getResult: jest.fn(),
};

const mockRsiInstance = {
  nextValue: jest.fn(),
  getResult: jest.fn(),
};

jest.mock('technicalindicators', () => {
  return {
    MACD: jest.fn().mockImplementation(() => mockMacdInstance),
    RSI: jest.fn().mockImplementation(() => mockRsiInstance),
  };
});

describe('MacdRsiStrategy', () => {
  let strategy: MacdRsiStrategy;
  let candles: Candle[];

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new MacdRsiStrategy();

    // Default Mock Returns to avoid errors
    mockMacdInstance.getResult.mockReturnValue([]);
    mockRsiInstance.getResult.mockReturnValue([]);

    // Create dummy candles (length 60 to pass length check)
    candles = Array.from({ length: 60 }, (_, i) => ({
      symbol: 'BTCUSDT',
      interval: '1m',
      isFinal: true,
      close: 100 + i,
      timestamp: i * 60000,
      open: 100 + i,
      high: 100 + i,
      low: 100 + i,
      volume: 100,
    }));
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should return ENTER_LONG when Golden Cross and RSI < 70', async () => {
    // Mock Golden Cross: Prev(MACD < Signal), Curr(MACD > Signal)
    // Prev: MACD=10, Signal=11
    // Curr: MACD=12, Signal=11
    mockMacdInstance.getResult.mockReturnValue([
      { MACD: 10, signal: 11, histogram: -1 },
      { MACD: 12, signal: 11, histogram: 1 },
    ]);

    // Mock RSI < 70
    mockRsiInstance.getResult.mockReturnValue([69, 50]); // Need at least length > 0. Last one is 50.

    const signal = await strategy.analyze(candles);

    expect(signal.action).toBe(TradingAction.EnterLong);
    expect(signal.metadata?.reason).toContain('MACD Golden Cross');
  });

  it('should return EXIT_SHORT when Golden Cross occurs', async () => {
    mockMacdInstance.getResult.mockReturnValue([
      { MACD: 10, signal: 11 },
      { MACD: 12, signal: 11 },
    ]);
    mockRsiInstance.getResult.mockReturnValue([50]);
    // RSI 50 -> Less than 70, so it might trigger EnterLong first.
    // However, if we look at the code:
    // 1. EnterLong (Golden & RSI < 70)
    // 2. EnterShort (Dead & RSI > 30)
    // 3. ExitLong (Dead)
    // 4. ExitShort (Golden)

    // If Gold Cross & RSI < 70, it hits logic 1 and returns EnterLong.
    // To hit logic 4 (ExitShort), we need to bypass logic 1.
    // Logic 1 requires RSI < 70. So if RSI >= 70, it skips Logic 1.

    mockRsiInstance.getResult.mockReturnValue([80]);

    const signal = await strategy.analyze(candles);
    expect(signal.action).toBe(TradingAction.ExitShort);
  });

  it('should return ENTER_SHORT when Dead Cross and RSI > 30', async () => {
    // Dead Cross: Prev(MACD > Signal), Curr(MACD < Signal)
    mockMacdInstance.getResult.mockReturnValue([
      { MACD: 12, signal: 11 },
      { MACD: 10, signal: 11 },
    ]);
    mockRsiInstance.getResult.mockReturnValue([40]); // > 30

    const signal = await strategy.analyze(candles);
    expect(signal.action).toBe(TradingAction.EnterShort);
  });

  it('should return EXIT_LONG when Dead Cross occurs', async () => {
    mockMacdInstance.getResult.mockReturnValue([
      { MACD: 12, signal: 11 },
      { MACD: 10, signal: 11 },
    ]);
    // Prevent EnterShort by RSI <= 30
    mockRsiInstance.getResult.mockReturnValue([20]);

    const signal = await strategy.analyze(candles);
    expect(signal.action).toBe(TradingAction.ExitLong);
  });

  it('should return HOLD when no crossover', async () => {
    mockMacdInstance.getResult.mockReturnValue([
      { MACD: 13, signal: 11 },
      { MACD: 14, signal: 11 },
    ]); // Continuing up
    mockRsiInstance.getResult.mockReturnValue([50]);

    const signal = await strategy.analyze(candles);
    expect(signal.action).toBe(TradingAction.Hold);
  });
});
