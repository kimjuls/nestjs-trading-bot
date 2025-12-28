import { VolatilityBreakoutStrategy } from './volatility-breakout.strategy';
import { Candle } from '../../exchange/dto/candle';
import { TradingSignal } from '../dto/trading-signal';
import { TradingAction } from '../enums/trading-action.enum';

describe('VolatilityBreakoutStrategy', () => {
  let strategy: VolatilityBreakoutStrategy;

  beforeEach(() => {
    strategy = new VolatilityBreakoutStrategy();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('analyze', () => {
    it('should return Hold if there is not enough data (less than 1 day)', async () => {
      const candles: Candle[] = [
        {
          symbol: 'BTCUSDT',
          interval: '1d',
          isFinal: true,
          open: 100,
          high: 110,
          low: 90,
          close: 105,
          volume: 1000,
          timestamp: new Date('2023-01-01T10:00:00Z').getTime(),
        },
      ];
      const result = await strategy.analyze(candles);
      expect(result.action).toBe(TradingAction.Hold);
    });

    it('should return Hold if current price does not exceed the target price', async () => {
      // Yesterday: High 110, Low 90 -> Range 20. K=0.5 -> Target Range 10.
      // Today Open: 100. Target Price = 110.
      // Current Price: 105.
      const candles: Candle[] = [
        // Yesterday
        {
          symbol: 'BTCUSDT',
          interval: '1d',
          isFinal: true,
          open: 100,
          high: 110,
          low: 90,
          close: 100,
          volume: 1000,
          timestamp: new Date('2023-01-01T10:00:00Z').getTime(),
        },
        // Today
        {
          symbol: 'BTCUSDT',
          interval: '1d',
          isFinal: true,
          open: 100,
          high: 105,
          low: 100,
          close: 105,
          volume: 1000,
          timestamp: new Date('2023-01-02T00:00:00Z').getTime(),
        },
        {
          symbol: 'BTCUSDT',
          interval: '1d',
          isFinal: true,
          open: 105,
          high: 105,
          low: 105,
          close: 105,
          volume: 1000,
          timestamp: new Date('2023-01-02T01:00:00Z').getTime(),
        },
      ];

      const result = await strategy.analyze(candles);
      expect(result.action).toBe(TradingAction.Hold);
    });

    it('should return EnterLong if current price exceeds the target price', async () => {
      // Yesterday: High 110, Low 90 -> Range 20. K=0.5 -> Target Range 10.
      // Today Open: 100. Target Price = 110.
      // Current Price: 111.
      const candles: Candle[] = [
        // Yesterday
        {
          symbol: 'BTCUSDT',
          interval: '1d',
          isFinal: true,
          open: 100,
          high: 110,
          low: 90,
          close: 100,
          volume: 1000,
          timestamp: new Date('2023-01-01T10:00:00Z').getTime(),
        },
        // Today
        {
          symbol: 'BTCUSDT',
          interval: '1d',
          isFinal: true,
          open: 100,
          high: 105,
          low: 100,
          close: 105,
          volume: 1000,
          timestamp: new Date('2023-01-02T00:00:00Z').getTime(),
        },
        {
          symbol: 'BTCUSDT',
          interval: '1d',
          isFinal: true,
          open: 105,
          high: 112,
          low: 105,
          close: 111,
          volume: 1000,
          timestamp: new Date('2023-01-02T01:00:00Z').getTime(),
        },
      ];

      const result = await strategy.analyze(candles);
      expect(result.action).toBe(TradingAction.EnterLong);
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.reason).toContain('Volatility Breakout');
    });
  });
});
