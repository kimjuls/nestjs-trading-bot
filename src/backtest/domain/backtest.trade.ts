export interface BacktestTrade {
  id: number;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryTime: Date;
  entryPrice: number;
  exitTime: Date;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  reason: string;
  cumulativeBalance: number;
}
