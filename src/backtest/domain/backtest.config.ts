export interface BacktestConfig {
  symbol: string;
  interval: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  riskPerTradePercent?: number;
  maxLeverage?: number;
  slippagePercent?: number;
  feePercent?: number;
}
