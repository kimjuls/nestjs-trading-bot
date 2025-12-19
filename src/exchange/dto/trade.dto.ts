import { OrderSide } from './order.dto';

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  price: number;
  quantity: number;
  commission: number;
  commissionAsset: string;
  timestamp: number;
  realizedPnl?: number; // For futures
}
