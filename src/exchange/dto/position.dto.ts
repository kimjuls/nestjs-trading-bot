export interface Position {
  symbol: string;
  size: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  leverage: number;
  marginType: 'isolated' | 'cross';
  liquidationPrice: number;
}
