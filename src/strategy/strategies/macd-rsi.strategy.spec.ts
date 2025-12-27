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
      timestamp: (i + 1) * 60000,
      open: 100 + i,
      high: 100 + i,
      low: 100 + i,
      volume: 100,
    }));
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  // Helper to mock sequential return values for nextValue
  const mockNextValue = (mockInstance: any, data: any[]) => {
    let callCount = 0;
    mockInstance.nextValue.mockImplementation(() => {
      // Since strategy processes filtered new candles.
      // We assume the test passes 'candles' which are all new.
      // Returns data[i] for call i.
      // If calls exceed data length, return undefined or last value?
      // Strategy checks if(mVal). So we should return valid objects.

      // We want to simulate that 'data' contains the results for the candles.
      // BUT, since we pass 60 candles, we need 60 results.
      // We can just return 'undefined' for the first 50 iterations, and then data values.
      const index = callCount++;
      const dataIndex = index - (60 - data.length);
      if (dataIndex >= 0 && dataIndex < data.length) {
        return data[dataIndex];
      }
      return { MACD: 0, signal: 0, histogram: 0 }; // Default dummy
    });
  };

  it('should return ENTER_LONG when Golden Cross and RSI < 70', async () => {
    // Mock Golden Cross: Prev(MACD < Signal), Curr(MACD > Signal)
    const macdData = [
      { MACD: 10, signal: 11, histogram: -1 },
      { MACD: 12, signal: 11, histogram: 1 },
    ];
    mockNextValue(mockMacdInstance, macdData);

    // Mock RSI < 70
    const rsiData = [69, 50];
    let rsiCallCount = 0;
    mockRsiInstance.nextValue.mockImplementation(() => {
      const index = rsiCallCount++;
      const dataIndex = index - (60 - rsiData.length);
      if (dataIndex >= 0) return rsiData[dataIndex];
      return 50;
    });

    const signal = await strategy.analyze(candles);

    expect(signal.action).toBe(TradingAction.EnterLong);
    expect(signal.metadata?.reason).toContain('MACD Golden Cross');
  });

  it('should return EXIT_SHORT when Golden Cross occurs', async () => {
    const macdData = [
      { MACD: 10, signal: 11 },
      { MACD: 12, signal: 11 },
    ];
    mockNextValue(mockMacdInstance, macdData);

    const rsiData = [80];
    let rsiCallCount = 0;
    mockRsiInstance.nextValue.mockImplementation(() => {
      const index = rsiCallCount++;
      // If only 1 data point provided, assume it's the last one.
      // For previous points, return something that doesn't trigger unrelated logic?
      if (index >= 59) return rsiData[0];
      return 50;
    });

    const signal = await strategy.analyze(candles);
    expect(signal.action).toBe(TradingAction.ExitShort);
  });

  it('should return ENTER_SHORT when Dead Cross and RSI > 30', async () => {
    // Dead Cross: Prev(MACD > Signal), Curr(MACD < Signal)
    const macdData = [
      { MACD: 12, signal: 11 },
      { MACD: 10, signal: 11 },
    ];
    mockNextValue(mockMacdInstance, macdData);

    const rsiData = [40]; // > 30
    let rsiCallCount = 0;
    mockRsiInstance.nextValue.mockImplementation(() => {
      if (rsiCallCount++ >= 59) return rsiData[0];
      return 50;
    });

    const signal = await strategy.analyze(candles);
    expect(signal.action).toBe(TradingAction.EnterShort);
  });

  it('should return EXIT_LONG when Dead Cross occurs', async () => {
    const macdData = [
      { MACD: 12, signal: 11 },
      { MACD: 10, signal: 11 },
    ];
    mockNextValue(mockMacdInstance, macdData);

    // Prevent EnterShort by RSI <= 30
    const rsiData = [20];
    let rsiCallCount = 0;
    mockRsiInstance.nextValue.mockImplementation(() => {
      if (rsiCallCount++ >= 59) return rsiData[0];
      return 50;
    });

    const signal = await strategy.analyze(candles);
    expect(signal.action).toBe(TradingAction.ExitLong);
  });

  it('should return HOLD when no crossover', async () => {
    const macdData = [
      { MACD: 13, signal: 11 },
      { MACD: 14, signal: 11 },
    ];
    mockNextValue(mockMacdInstance, macdData);

    let rsiCallCount = 0;
    mockRsiInstance.nextValue.mockImplementation(() => 50);

    const signal = await strategy.analyze(candles);
    expect(signal.action).toBe(TradingAction.Hold);
  });
});
