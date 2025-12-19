import { Inject, Injectable, Logger } from '@nestjs/common';
import { ExecutionService } from '../domain/execution.service';
import { ExchangeClient } from '../../exchange/domain/exchange.client';
import { SignalType, TradeSignal } from '../dto/trade-signal.dto';
import {
  CreateOrderDto,
  Order,
  OrderSide,
  OrderType,
} from '../../exchange/dto/order.dto';

@Injectable()
export class SimpleExecutionService implements ExecutionService {
  private readonly logger = new Logger(SimpleExecutionService.name);
  private readonly defaultQuantity = 0.001; // Temporary standard size

  constructor(
    @Inject('ExchangeClient') private readonly exchangeClient: ExchangeClient,
  ) {}

  async execute(signal: TradeSignal): Promise<Order> {
    this.logger.log(`Executing signal: ${JSON.stringify(signal)}`);

    const side = this.mapSignalToSide(signal.type);
    const type = signal.price ? OrderType.LIMIT : OrderType.MARKET;
    const quantity = signal.quantity || this.defaultQuantity;

    const orderDto: CreateOrderDto = {
      symbol: signal.symbol,
      side: side,
      type: type,
      quantity: quantity,
      price: signal.price,
    };

    try {
      const order = await this.exchangeClient.createOrder(orderDto);
      this.logger.log(`Order placed successfully: ${order.id}`);
      return order;
    } catch (error) {
      this.logger.error(`Failed to execute order: ${error.message}`, error);
      throw error;
    }
  }

  private mapSignalToSide(type: SignalType): OrderSide {
    switch (type) {
      case SignalType.Long:
        return OrderSide.BUY;
      case SignalType.Short:
        return OrderSide.SELL;
      case SignalType.ExitLong:
        return OrderSide.SELL;
      case SignalType.ExitShort:
        return OrderSide.BUY;
      default:
        throw new Error(`Unknown signal type: ${type}`);
    }
  }
}
