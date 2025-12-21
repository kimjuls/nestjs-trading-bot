export interface PaperPosition {
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  leverage: number;
  openTime: number;
}
