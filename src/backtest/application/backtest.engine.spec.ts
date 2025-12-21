import { Test, TestingModule } from '@nestjs/testing';
import { BacktestEngine } from './backtest.engine';
import { BacktestPositionManager } from './backtest.position.manager';
import { BacktestConfig } from '../domain/backtest.config';
import { Candle } from '../../exchange/dto/candle';
import { TradeStrategy } from '../../strategy/interfaces/trade-strategy.interface';
import { TradingAction } from '../../strategy/enums/trading-action.enum';

const mockHistoricalLoader = {
  loadCandles: jest.fn(),
};

const mockStrategy: TradeStrategy = {
  analyze: jest.fn(),
  onInit: jest.fn(),
};

describe('BacktestEngine', () => {
  let engine: BacktestEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BacktestEngine,
        BacktestPositionManager,
        {
          provide: 'HistoricalDataLoader',
          useValue: mockHistoricalLoader,
        },
      ],
    }).compile();

    engine = module.get<BacktestEngine>(BacktestEngine);
  });

  it('should be defined', () => {
    expect(engine).toBeDefined();
  });

  it('should run backtest and return results', async () => {
    // Setup Mock Data
    const mockCandles: Candle[] = Array(100)
      .fill(null)
      .map((_, i) => ({
        symbol: 'BTCUSDT',
        interval: '1m',
        close: 100 + i,
        timestamp: i * 60000,
        open: 100 + i,
        high: 100 + i,
        low: 100 + i,
        volume: 100,
        isFinal: true,
      }));

    mockHistoricalLoader.loadCandles.mockResolvedValue(mockCandles);

    // Strategy Mock: Buy at i=50, Sell at i=60
    (mockStrategy.analyze as jest.Mock).mockImplementation(
      async (candles: Candle[]) => {
        const current = candles[candles.length - 1];
        const index = current.timestamp / 60000;

        if (index === 50)
          return {
            action: TradingAction.EnterLong,
            price: current.close,
            timestamp: current.timestamp,
          };
        if (index === 60)
          return {
            action: TradingAction.ExitLong,
            price: current.close,
            timestamp: current.timestamp,
          };
        return { action: TradingAction.Hold };
      },
    );

    const config: BacktestConfig = {
      symbol: 'BTCUSDT',
      interval: '1m',
      startDate: new Date(0),
      endDate: new Date(100 * 60000),
      initialCapital: 10000,
    };

    const result = await engine.run(config, mockStrategy);

    expect(result).toBeDefined();
    expect(result.trades.length).toBe(1);
    expect(result.metrics.winningTrades).toBe(1); // 100 -> 160 is profit
  });
});
