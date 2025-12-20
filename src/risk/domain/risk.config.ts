export interface RiskConfig {
  /**
   * 일일 최대 손실 허용 비율 (예: 0.02 = 2%)
   * 이 한도를 초과하면 당일 추가 거래를 제한해야 함.
   */
  maxDailyLossPercent: number;

  /**
   * 트레이드 당 최대 레버리지 (예: 5 = 5배)
   */
  maxLeverage: number;

  /**
   * 한 번의 트레이드에 허용할 자산 대비 손실 비율 (예: 0.01 = 1%)
   * 포지션 사이징의 기준이 됨.
   */
  riskPerTradePercent: number;

  /**
   * 최소 손익비 (Reward to Risk Ratio) (예: 1.5)
   * 이 비율보다 손익비가 낮은 진입 신호는 무시함.
   */
  rewardToRiskRatio: number;
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  maxDailyLossPercent: 0.03, // 3%
  maxLeverage: 5, // 5x
  riskPerTradePercent: 0.01, // 1%
  rewardToRiskRatio: 1.5, // 1.5
};
