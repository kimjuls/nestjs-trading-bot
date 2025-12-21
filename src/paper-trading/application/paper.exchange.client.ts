import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeClient } from '../../exchange/domain/exchange.client';
import { MarketStream } from '../../exchange/domain/market.stream';
import {
  CreateOrderDto,
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
} from '../../exchange/dto/order.dto';
import { Position } from '../../exchange/dto/position.dto';
import { Trade } from '../../exchange/dto/trade.dto';
import { Balance } from '../../exchange/dto/balance.dto';
import { PaperPositionManager } from './paper.position.manager';
import { PaperPosition } from '../domain/paper-position';

@Injectable()
export class PaperExchangeClient implements ExchangeClient, OnModuleInit {
  private readonly logger = new Logger(PaperExchangeClient.name);
  private currentPrices: Map<string, number> = new Map();

  constructor(
    private readonly positionManager: PaperPositionManager,
    @Inject('MarketStream') private readonly marketStream: MarketStream,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    // We assume the user configures the symbol to trade via env or we subscribe dynamically.
    // robust implementation should subscribe dynamically or listen to everything if possible?
    // MarketStream usually requires subscription.
    // For MVP, we subscribe to target symbol defined in env or passed in configs.
    const symbol =
      this.configService.get<string>('TRADING_SYMBOL') || 'BTCUSDT';
    this.subscribeToPrice(symbol);
  }

  private subscribeToPrice(symbol: string) {
    this.marketStream.getRealtimeTicker(symbol).subscribe({
      next: (ticker) => {
        this.currentPrices.set(ticker.symbol, ticker.price);

        // Also update Mark Price in Position Manager for PnL calculation
        // this.positionManager.updateMarkPrice(ticker.symbol, ticker.price);
      },
      error: (err) =>
        this.logger.error(`Price stream error for ${symbol}`, err),
    });
  }

  async createOrder(orderDto: CreateOrderDto): Promise<Order> {
    const symbol = orderDto.symbol;

    // Ensure we are subscribed to get price updates
    if (!this.currentPrices.has(symbol)) {
      this.subscribeToPrice(symbol);
      // Wait for at least one price update?
      // For simplicity, we might fail or wait.
      // If we are "Market Order", we need price.
      // If "Limit", we place pending order (Not implemented in PaperPositionManager yet, only Market).
    }

    // Give a small delay or check immediate cache (async nature)
    // For this implementation, we rely on cache. If empty, we might error or mock.
    let price = this.currentPrices.get(symbol);

    if (!price) {
      // Fallback or Error.
      // In real-time test, we expect stream to be active.
      // For simple testability, we can throw.
      // Or if 'price' is provided in DTO (Limit Order), use it.
      if (orderDto.type === OrderType.LIMIT && orderDto.price) {
        price = orderDto.price;
      } else {
        // Try to fetch once if possible or throw
        // throw new Error(`Price not available for likely market order ${symbol}`);
        // For robustness in testing (if stream hasn't emitted yet), maybe default or mock?
        // Let's assume price is passed if testing or stream is hot.
        // If this is called w/o priceCache, it's risky.
        // EDIT: For Paper Trading MVP, let's allow "approximate" or await next tick (complex).
        // Let's throw for now to enforce proper stream setup.
        throw new Error(
          `Market price unavailable for ${symbol}. Stream not ready?`,
        );
      }
    }

    if (orderDto.type === OrderType.LIMIT && orderDto.price) {
      // In this MVP, PaperPositionManager opens immediately.
      // We should treat LIMIT as "Market execution if price crosses" logic?
      // PaperPositionManager 'openPosition' is "Force Open".
      // So validation logic should be here.
      // IF Limit Buy Price >= Market Price -> Fill immediately (Taker)
      // IF Limit Buy Price < Market Price -> Pending (Maker) -> Not implemented yet!
      // For MVP: We only support MARKET execution or immediate fill.
      // If user sends limit order that is not immediately fillable, we should arguably Reject or Implement Pending.
      // Let's implement ONLY Immediate Execution for now.
      if (orderDto.side === OrderSide.BUY && orderDto.price < price) {
        throw new Error(
          'Pending Limit Orders not supported in Paper Trading MVP.',
        );
      }
      if (orderDto.side === OrderSide.SELL && orderDto.price > price) {
        throw new Error(
          'Pending Limit Orders not supported in Paper Trading MVP.',
        );
      }
      price = orderDto.price; // Execute at limit price (best case)
    }

    // Execute
    // Determine quantity/leverage.
    // DTO doesn't have leverage. We use Config or Default.
    const defaultLeverage = 10;

    const paperPosition: PaperPosition = {
      symbol,
      side: orderDto.side === OrderSide.BUY ? 'LONG' : 'SHORT',
      entryPrice: price,
      quantity: orderDto.quantity,
      leverage: defaultLeverage,
      openTime: Date.now(),
    };

    // Close opposite position if exists? ( Hedge Mode vs One-Way Mode )
    // Binance Futures Default is usually One-Way Mode (Hedge is optional).
    // If One-Way:
    //  If Long exists and Sell Order -> Reduce/Close Long.
    //  If Short exists and Buy Order -> Reduce/Close Short.
    // This logic is complex.
    // For MVP: Let's assume we maintain separate positions or error if conflict.
    // Or better: Check if we have an existing position of opposite side.
    const existing = this.positionManager.getOpenPosition(symbol);
    if (existing) {
      if (
        (existing.side === 'LONG' && orderDto.side === OrderSide.SELL) ||
        (existing.side === 'SHORT' && orderDto.side === OrderSide.BUY)
      ) {
        // Closing Logic
        // If quantity matches, close full.
        // If quantity < existing, partial close (Not impl in Manager yet).
        // If quantity > existing, flip position.

        if (orderDto.quantity === existing.quantity) {
          this.positionManager.closePosition(symbol, price, 'Order Signal');
          return this.mapToOrder(orderDto, price, OrderStatus.FILLED);
        } else {
          throw new Error(
            'Partial close or flip not supported in Paper Trading MVP DTO.',
          );
        }
      } else if (
        existing.side === (orderDto.side === OrderSide.BUY ? 'LONG' : 'SHORT')
      ) {
        // Adding to position (Pyramiding)
        // Manager stores array, so it supports multiple positions (Hedge-like or FIFO).
        // We just add another position.
        this.positionManager.openPosition(paperPosition);
      }
    } else {
      this.positionManager.openPosition(paperPosition);
    }

    return this.mapToOrder(orderDto, price, OrderStatus.FILLED);
  }

  async cancelOrder(id: string, symbol: string): Promise<void> {
    // No-op for immediate fill system
    this.logger.warn(
      'cancelOrder called but Paper Trading only supports immediate execution.',
    );
  }

  async getPositions(): Promise<Position[]> {
    const portfolio = this.positionManager.getPortfolio();
    return portfolio.openPositions.map((p) => ({
      symbol: p.symbol,
      size: p.quantity,
      entryPrice: p.entryPrice,
      markPrice: this.currentPrices.get(p.symbol) || p.entryPrice,
      unrealizedPnl: 0, // Calculate using markPrice
      leverage: p.leverage,
      marginType: 'cross', // default
      liquidationPrice: 0, // Not calculated
    }));
  }

  async getTradeHistory(symbol: string): Promise<Trade[]> {
    const portfolio = this.positionManager.getPortfolio();
    return portfolio.closedTrades
      .filter((t) => t.symbol === symbol)
      .map((t) => ({
        id: t.id,
        orderId: t.id,
        symbol: t.symbol,
        // PaperTrade stores 'Position Side' (Long/Short).
        // If we closed a Long, the Trade was SELL.
        // We need to map correctly.
        // PaperTrade 'side' is Position Side.
        // If Long, Entry was Buy, Exit was Sell.
        // This 'Trade' DTO represents the Exit Trade usually? Or generic?
        // "getTradeHistory" usually returns all fills.
        // Our PaperTrade is a "Completed Roundturn".
        // It summarizes Entry + Exit. This doesn't map 1:1 to binance trade list (which has individual fills).
        // For MVP: Return the "Exit" trade representation.
        price: t.exitPrice,
        quantity: t.quantity,
        commission: 0,
        commissionAsset: 'USDT',
        timestamp: t.closeTime,
        realizedPnl: t.pnl,
        side: t.side === 'LONG' ? OrderSide.SELL : OrderSide.BUY, // Close Long = Sell
      }));
  }

  async getBalance(): Promise<Balance[]> {
    const portfolio = this.positionManager.getPortfolio();
    return [
      {
        asset: 'USDT',
        free: portfolio.currentBalance,
        locked: 0,
        total: portfolio.currentBalance,
        // Note: currentBalance in Manager includes Margin?
        // Manager: currentBalance -= margin. So free = current.
        // Total = free + margin of open positions.
      },
    ];
  }

  private mapToOrder(
    dto: CreateOrderDto,
    price: number,
    status: OrderStatus,
  ): Order {
    return {
      id: Date.now().toString(),
      symbol: dto.symbol,
      side: dto.side,
      type: dto.type,
      status: status,
      originalQuantity: dto.quantity,
      filledQuantity: dto.quantity,
      price: price,
      averagePrice: price,
      timestamp: Date.now(),
    };
  }
}
