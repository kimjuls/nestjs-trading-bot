import { BacktestConfig } from './backtest.config';
import { BacktestTrade } from './backtest.trade';

export interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;

  totalPnl: number;
  totalPnlPercent: number;

  averageWin: number;
  averageLoss: number;
  profitFactor: number;

  maxDrawdown: number;
  maxDrawdownPercent: number;

  sharpeRatio?: number;
}

export interface EquityPoint {
  timestamp: Date;
  balance: number;
  drawdownPercent: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  trades: BacktestTrade[];
  metrics: BacktestMetrics;
  equityCurve: EquityPoint[];
}
