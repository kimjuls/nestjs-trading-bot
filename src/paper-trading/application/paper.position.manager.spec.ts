import { Test, TestingModule } from '@nestjs/testing';
import { PaperPositionManager } from './paper.position.manager';
import { PaperPosition } from '../domain/paper-position';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

describe('PaperPositionManager', () => {
  let manager: PaperPositionManager;
  const initialBalance = 10000;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaperPositionManager,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(String(initialBalance)),
          },
        },
      ],
    }).compile();

    manager = module.get<PaperPositionManager>(PaperPositionManager);

    // Initialize manager with explicit balance to ensure test isolation
    manager.init(initialBalance);
  });

  it('should be defined', () => {
    expect(manager).toBeDefined();
  });

  describe('openPosition', () => {
    it('should open a long position and deduct margin', () => {
      const position: PaperPosition = {
        symbol: 'BTCUSDT',
        side: 'LONG',
        entryPrice: 50000,
        quantity: 0.1, // 5000 USDT value
        leverage: 10, // Margin = 500 USDT
        openTime: Date.now(),
      };

      manager.openPosition(position);

      const portfolio = manager.getPortfolio();
      expect(portfolio.openPositions).toHaveLength(1);
      expect(portfolio.currentBalance).toBe(9500); // 10000 - 500
      expect(portfolio.openPositions[0]).toEqual(position);
    });

    it('should throw error if insufficient balance', () => {
      const position: PaperPosition = {
        symbol: 'BTCUSDT',
        side: 'LONG',
        entryPrice: 50000,
        quantity: 10, // 500,000 USDT value
        leverage: 1, // Margin = 500,000 USDT
        openTime: Date.now(),
      };

      expect(() => manager.openPosition(position)).toThrow(BadRequestException);
    });
  });

  describe('closePosition', () => {
    it('should close a long position with profit', () => {
      // Open Position: Buy 0.1 BTC @ 50,000 (Value: 5000, Lev: 10, Margin: 500)
      const position: PaperPosition = {
        symbol: 'BTCUSDT',
        side: 'LONG',
        entryPrice: 50000,
        quantity: 0.1,
        leverage: 10,
        openTime: Date.now(),
      };
      manager.openPosition(position);

      // Close Position: Sell 0.1 BTC @ 55,000 (+10%)
      // PnL = (55000 - 50000) * 0.1 = 500 USDT
      // Fee = 55000 * 0.1 * 0.0004 = 2.2 USDT
      // Net PnL = 497.8 USDT
      // Returned to Balance = Margin(500) + Net PnL(497.8) = 997.8
      // New Balance = 9500 + 997.8 = 10497.8

      const trade = manager.closePosition('BTCUSDT', 55000, 'Test Exit');

      expect(trade.pnl).toBeCloseTo(497.8);
      expect(manager.getPortfolio().currentBalance).toBeCloseTo(10497.8);
      expect(manager.getPortfolio().openPositions).toHaveLength(0);
      expect(manager.getPortfolio().closedTrades).toHaveLength(1);
    });

    it('should close a short position with loss', () => {
      // Open Position: Sell 0.1 BTC @ 50,000 (Value: 5000, Lev: 10, Margin: 500)
      const position: PaperPosition = {
        symbol: 'BTCUSDT',
        side: 'SHORT',
        entryPrice: 50000,
        quantity: 0.1,
        leverage: 10,
        openTime: Date.now(),
      };
      manager.openPosition(position);

      // Close Position: Buy 0.1 BTC @ 51,000 (-2%)
      // PnL = (50000 - 51000) * 0.1 = -100 USDT
      // Fee = 51000 * 0.1 * 0.0004 = 2.04 USDT
      // Net PnL = -102.04 USDT
      // Returned to Balance = Margin(500) - 102.04 = 397.96
      // New Balance = 9500 + 397.96 = 9897.96

      const trade = manager.closePosition('BTCUSDT', 51000, 'Stop Loss');

      expect(trade.pnl).toBeCloseTo(-102.04);
      expect(manager.getPortfolio().currentBalance).toBeCloseTo(9897.96);
    });
  });
});
