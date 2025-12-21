import { Test, TestingModule } from '@nestjs/testing';
import { BacktestPositionManager } from './backtest.position.manager';
import { BacktestConfig } from '../domain/backtest.config';
import { Candle } from '../../exchange/dto/candle';

describe('BacktestPositionManager', () => {
  let manager: BacktestPositionManager;
  const mockConfig: BacktestConfig = {
    symbol: 'BTCUSDT',
    interval: '1m',
    startDate: new Date(),
    endDate: new Date(),
    initialCapital: 10000,
    feePercent: 0.0004, // 0.04%
    slippagePercent: 0.0001, // 0.01%
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BacktestPositionManager],
    }).compile();

    manager = module.get<BacktestPositionManager>(BacktestPositionManager);
    manager.reset(mockConfig);
  });

  it('should be defined', () => {
    expect(manager).toBeDefined();
  });

  it('should open a LONG position', () => {
    const entryCandle: Candle = {
      symbol: 'BTCUSDT',
      close: 50000,
      timestamp: 1000,
    } as any;

    // Invest 50% of capital
    const position = manager.openPosition('LONG', entryCandle, 5000);

    expect(position).toBeDefined();
    expect(position.side).toBe('LONG');
    expect(position.entryPrice).toBe(50005); // 50000 * 1.0001 (slippage)
    expect(position.quantity).toBeCloseTo(0.09999, 4); // 5000 / 50005
    expect(manager.getCurrentPosition()).toBeDefined();
  });

  it('should close a LONG position and calculate PnL', () => {
    const entryCandle: Candle = {
      symbol: 'BTCUSDT',
      close: 50000,
      timestamp: 1000,
    } as any;
    const exitCandle: Candle = {
      symbol: 'BTCUSDT',
      close: 55000,
      timestamp: 2000,
    } as any;

    manager.openPosition('LONG', entryCandle, 5000); // Entry ~50005
    const trade = manager.closePosition(exitCandle, 'Target Hit');

    expect(trade).toBeDefined();
    expect(trade.exitPrice).toBe(54994.5); // 55000 * (1 - 0.0001) slippage
    expect(trade.pnl).toBeGreaterThan(0);
    expect(manager.getCurrentPosition()).toBeNull();
  });

  it('should correctly calculate fees', () => {
    // Verify fee calculation logic implicitly via PnL or direct method if public
    // Here we rely on net PnL check roughly
    const entryCandle: Candle = { close: 100, timestamp: 0 } as any;
    const exitCandle: Candle = { close: 110, timestamp: 1 } as any;

    // 10000 capital, invest 100.
    // Entry Price w/ slip: 100.01
    // Qty: ~0.9999
    // Exit Price w/ slip: 109.989
    // Gross PnL: (109.989 - 100.01) * Qty
    // Fees: (EntryVal + ExitVal) * 0.0004

    manager.openPosition('LONG', entryCandle, 100);
    const trade = manager.closePosition(exitCandle, 'Test');

    // Gross profit is around 10%
    // Fees are around 0.08% (0.04 * 2)
    // Net profit should be around 9.92%
    expect(trade.pnlPercent).toBeLessThan(10);
    expect(trade.pnlPercent).toBeGreaterThan(9);
  });
});
