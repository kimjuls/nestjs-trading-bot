export enum OrderSide {
  Buy = 'BUY',
  Sell = 'SELL',
}

export interface OrderRequest {
  symbol: string;
  side: OrderSide;
  /**
   * 진입 수량 (코인 개수)
   */
  quantity: number;
  /**
   * 예상 진입가
   */
  entryPrice: number;
  /**
   * 손절가
   */
  stopLossPrice: number;
  /**
   * 익절가
   */
  takeProfitPrice: number;
  /**
   * 적용 레버리지
   */
  leverage: number;
}
