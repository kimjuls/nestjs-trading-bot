import { Balance } from '../dto/balance.dto';
import { CreateOrderDto, Order } from '../dto/order.dto';
import { Position } from '../dto/position.dto';
import { Trade } from '../dto/trade.dto';

export interface ExchangeClient {
  /**
   * Place a new order on the exchange.
   */
  createOrder(order: CreateOrderDto): Promise<Order>;

  /**
   * Cancel an existing order.
   */
  cancelOrder(id: string, symbol: string): Promise<void>;

  /**
   * Get current open positions.
   */
  getPositions(): Promise<Position[]>;

  /**
   * Get trade history.
   */
  getTradeHistory(symbol: string): Promise<Trade[]>;

  /**
   * Get account balance.
   */
  getBalance(): Promise<Balance[]>;
}
