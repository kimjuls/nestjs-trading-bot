import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { USDMClient } from 'binance';
import { ExchangeClient } from '../domain/exchange.client';
import {
  CreateOrderDto,
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
} from '../dto/order.dto';
import { Position } from '../dto/position.dto';
import { Trade } from '../dto/trade.dto';
import { Balance } from '../dto/balance.dto';

@Injectable()
export class BinanceExchangeClient implements ExchangeClient {
  private readonly logger = new Logger(BinanceExchangeClient.name);
  private client: USDMClient;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('BINANCE_API_KEY');
    const apiSecret = this.configService.get<string>('BINANCE_API_SECRET');
    const useTestnet =
      this.configService.get<string>('BINANCE_USE_TESTNET') === 'true';

    if (!apiKey || !apiSecret) {
      throw new Error('Binance API Key or Secret not found.');
    }

    this.client = new USDMClient({
      api_key: apiKey,
      api_secret: apiSecret,
      baseUrl: useTestnet ? 'https://testnet.binancefuture.com' : undefined,
    });
  }

  async createOrder(orderDto: CreateOrderDto): Promise<Order> {
    try {
      const response = await this.client.submitNewOrder({
        symbol: orderDto.symbol,
        side: orderDto.side as any, // Cast to any if enum mismatch, verify later
        type: orderDto.type as any,
        quantity: orderDto.quantity,
        price: orderDto.price,
        // timeInForce: 'GTC', // Default to GTC for limit orders usually
      });

      return this.mapOrder(response);
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`, error);
      throw error;
    }
  }

  async cancelOrder(id: string, symbol: string): Promise<void> {
    try {
      await this.client.cancelOrder({
        symbol,
        orderId: Number(id),
      });
    } catch (error) {
      this.logger.error(`Failed to cancel order: ${error.message}`, error);
      throw error;
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      const response = await this.client.getPositions();
      // Filter for non-zero positions if needed, or return all?
      // Usually we only care about active positions.
      return response
        .filter((p: any) => Number(p.positionAmt) !== 0)
        .map((p: any) => ({
          symbol: p.symbol,
          size: Number(p.positionAmt),
          entryPrice: Number(p.entryPrice),
          markPrice: Number(p.markPrice), // Note: Verify if markPrice is available in this endpoint
          unrealizedPnl: Number(p.unRealizedProfit),
          leverage: Number(p.leverage),
          marginType: p.marginType as 'isolated' | 'cross',
          liquidationPrice: Number(p.liquidationPrice),
        }));
    } catch (error) {
      this.logger.error(`Failed to get positions: ${error.message}`, error);
      throw error;
    }
  }

  async getTradeHistory(symbol: string): Promise<Trade[]> {
    try {
      const response = await this.client.getAccountTrades({ symbol });
      return response.map((t: any) => ({
        id: String(t.id),
        orderId: String(t.orderId),
        symbol: t.symbol,
        side: t.side as OrderSide,
        price: Number(t.price),
        quantity: Number(t.qty),
        commission: Number(t.commission),
        commissionAsset: t.commissionAsset,
        timestamp: t.time,
        realizedPnl: Number(t.realizedPnl),
      }));
    } catch (error) {
      this.logger.error(`Failed to get trade history: ${error.message}`, error);
      throw error;
    }
  }

  async getBalance(): Promise<Balance[]> {
    try {
      // For Futures, we usually check getBalance or getAccountInformation
      const response = await this.client.getBalance();
      return response.map((b: any) => ({
        asset: b.asset,
        free: Number(b.availableBalance), // check mapping
        locked: Number(b.balance) - Number(b.availableBalance), // approximation?
        total: Number(b.balance),
      }));
    } catch (error) {
      this.logger.error(`Failed to get balance: ${error.message}`, error);
      throw error;
    }
  }

  private mapOrder(raw: any): Order {
    return {
      id: String(raw.orderId),
      symbol: raw.symbol,
      side: raw.side as OrderSide,
      type: raw.type as OrderType,
      status: raw.status as OrderStatus,
      originalQuantity: Number(raw.origQty),
      filledQuantity: Number(raw.executedQty),
      price: Number(raw.price),
      averagePrice: raw.avgPrice ? Number(raw.avgPrice) : undefined,
      timestamp: raw.updateTime || raw.time,
    };
  }
}
