import { Test, TestingModule } from '@nestjs/testing';
import { PercentPositionSizer } from './percent.position.sizer';
import { RiskConfig } from '../domain/risk.config';

describe('PercentPositionSizer', () => {
  let sizer: PercentPositionSizer;
  const mockConfig: RiskConfig = {
    riskPerTradePercent: 0.01, // 1%
    maxDailyLossPercent: 0.03,
    maxLeverage: 5,
    rewardToRiskRatio: 1.5,
  };

  beforeEach(async () => {
    sizer = new PercentPositionSizer(mockConfig);
  });

  it('should be defined', () => {
    expect(sizer).toBeDefined();
  });

  it('should calculate quantity correctly for LONG position', () => {
    // 가정: 자산 10,000 USDT, 진입가 100, 손절가 95 (손절폭 5)
    // 리스크 허용액 = 10,000 * 0.01 = 100 USDT
    // 필요 수량 = 100 / 5 = 20 개
    const equity = 10000;
    const entry = 100;
    const sl = 95;

    const qty = sizer.calculate(equity, entry, sl);
    expect(qty).toBeCloseTo(20);
  });

  it('should calculate quantity correctly for SHORT position', () => {
    // 가정: 자산 10,000 USDT, 진입가 100, 손절가 105 (손절폭 5)
    // 리스크 허용액 = 100 USDT
    // 필요 수량 = 100 / 5 = 20 개
    const equity = 10000;
    const entry = 100;
    const sl = 105;

    const qty = sizer.calculate(equity, entry, sl);
    expect(qty).toBeCloseTo(20);
  });

  it('should return 0 or throw error if stop loss equals entry price (division by zero protection)', () => {
    const equity = 10000;
    const entry = 100;
    const sl = 100;

    // 0을 반환하거나 Infinity를 반환할 수 있음. 구현 정의에 따름.
    // 여기서는 안전하게 0을 반환한다고 가정.
    const qty = sizer.calculate(equity, entry, sl);
    expect(qty).toBe(0);
  });
});
