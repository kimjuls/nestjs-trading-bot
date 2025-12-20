import { Test, TestingModule } from '@nestjs/testing';
import { StandardRiskManager } from './standard.risk.manager';
import { PercentPositionSizer } from './percent.position.sizer';
import { RiskConfig, DEFAULT_RISK_CONFIG } from '../domain/risk.config';
import { AccountBalance, TradeSignal } from '../domain/risk.manager';
import { OrderSide } from '../domain/structures';

describe('StandardRiskManager', () => {
  let riskManager: StandardRiskManager;
  let positionSizer: PercentPositionSizer;
  const mockConfig: RiskConfig = { ...DEFAULT_RISK_CONFIG };

  beforeEach(async () => {
    // 실제 PositionSizer 로직을 사용하여 통합 테스트 성격의 단위 테스트 진행
    positionSizer = new PercentPositionSizer(mockConfig);
    riskManager = new StandardRiskManager(mockConfig, positionSizer);
  });

  it('should be defined', () => {
    expect(riskManager).toBeDefined();
  });

  it('should create a valid order request when signal is safe', async () => {
    const balance: AccountBalance = {
      totalEquity: 10000,
      availableBalance: 10000,
    };
    const signal: TradeSignal = {
      symbol: 'BTCUSDT',
      side: OrderSide.Buy,
      entryPrice: 50000,
      stopLossPrice: 49000, // 1000불 손절폭 (2%)
      takeProfitPrice: 52000, // 2000불 익절폭 (4%) -> 손익비 2.0 (OK)
    };

    // 1% Risk = 100불
    // 손절폭 1000불
    // 수량 = 0.1 BTC
    // 레버리지 검증: 0.1 * 50000 = 5000불. 레버리지 0.5배 (OK)

    const order = await riskManager.evaluate(signal, balance);

    expect(order.symbol).toBe('BTCUSDT');
    expect(order.quantity).toBeCloseTo(0.1);
    expect(order.stopLossPrice).toBe(49000);
    expect(order.takeProfitPrice).toBe(52000);
  });

  it('should reject if Reward/Risk ratio is too low', async () => {
    const balance: AccountBalance = {
      totalEquity: 10000,
      availableBalance: 10000,
    };
    const signal: TradeSignal = {
      symbol: 'BTCUSDT',
      side: OrderSide.Buy,
      entryPrice: 50000,
      stopLossPrice: 49000, // Risk 1000
      takeProfitPrice: 50500, // Reward 500 -> Ratio 0.5 (Too Low)
    };

    await expect(riskManager.evaluate(signal, balance)).rejects.toThrow(
      'Risk Reward Ratio is too low',
    );
  });

  it('should calculate StopLoss if not provided (simple logic)', async () => {
    // TODO: 이번 구현 범위에는 포함되지 않았으나, 확장을 위해 테스트 케이스만 남겨둠.
    // 현재는 SL 입력 필수.
  });
});
