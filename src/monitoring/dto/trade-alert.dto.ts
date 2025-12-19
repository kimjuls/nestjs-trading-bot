export class TradeAlertDto {
  symbol: string;
  action: 'OPEN_LONG' | 'OPEN_SHORT' | 'CLOSE_LONG' | 'CLOSE_SHORT';
  price: number;
  quantity: number;
  profit?: number;
  strategyName?: string;
  timestamp: Date;
}
