import { Order } from '../../exchange/dto/order.dto';
import { TradeSignal } from '../dto/trade-signal.dto';

export interface ExecutionService {
  execute(signal: TradeSignal): Promise<Order>;
}
