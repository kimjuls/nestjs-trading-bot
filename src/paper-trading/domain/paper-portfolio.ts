import { PaperPosition } from './paper-position';
import { PaperTrade } from './paper-trade';

export interface PaperPortfolio {
  initialBalance: number;
  currentBalance: number;
  totalPnl: number;
  totalPnlPercent: number;
  openPositions: PaperPosition[];
  closedTrades: PaperTrade[];
}
