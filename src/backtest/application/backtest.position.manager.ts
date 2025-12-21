import { Injectable, Logger } from '@nestjs/common';
import { BacktestConfig } from '../domain/backtest.config';
import { BacktestTrade } from '../domain/backtest.trade';
import { Candle } from '../../exchange/dto/candle';

interface InternalPosition {
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  entryTime: Date;
}

@Injectable()
export class BacktestPositionManager {
  private readonly logger = new Logger(BacktestPositionManager.name);
  private config: BacktestConfig;
  private currentBalance: number;
  private currentPosition: InternalPosition | null = null;
  private tradeCount = 0;

  reset(config: BacktestConfig) {
    this.config = config;
    this.currentBalance = config.initialCapital;
    this.currentPosition = null;
    this.tradeCount = 0;
  }

  getCurrentPosition(): InternalPosition | null {
    return this.currentPosition;
  }

  getCurrentBalance(): number {
    return this.currentBalance;
  }

  openPosition(
    side: 'LONG' | 'SHORT',
    candle: Candle,
    amount: number,
  ): InternalPosition {
    if (this.currentPosition) {
      throw new Error('Position already exists');
    }

    const slippage = this.config.slippagePercent || 0;
    const price =
      side === 'LONG'
        ? candle.close * (1 + slippage)
        : candle.close * (1 - slippage);

    const quantity = amount / price;

    this.currentPosition = {
      symbol: this.config.symbol,
      side,
      entryPrice: price,
      quantity,
      entryTime: new Date(candle.timestamp),
    };

    return this.currentPosition;
  }

  closePosition(candle: Candle, reason: string): BacktestTrade {
    if (!this.currentPosition) {
      throw new Error('No position to close');
    }

    const pos = this.currentPosition;
    const slippage = this.config.slippagePercent || 0;
    const feeRate = this.config.feePercent || 0;

    // Calculate exit price with slippage
    // LONG exit: sell, receive lower price if slip
    // SHORT exit: buy, pay higher price if slip
    const exitPrice =
      pos.side === 'LONG'
        ? candle.close * (1 - slippage)
        : candle.close * (1 + slippage);

    // Calculate Gross PnL
    const priceDiff =
      pos.side === 'LONG'
        ? exitPrice - pos.entryPrice
        : pos.entryPrice - exitPrice;

    const grossPnl = priceDiff * pos.quantity;

    // Calculate Fees (on Entry + Exit volume)
    // Entry Volume = EntryPrice * Qty
    // Exit Volume = ExitPrice * Qty
    const entryVol = pos.entryPrice * pos.quantity;
    const exitVol = exitPrice * pos.quantity;
    const totalFees = (entryVol + exitVol) * feeRate;

    const netPnl = grossPnl - totalFees;

    // Update Balance
    this.currentBalance += netPnl;

    const trade: BacktestTrade = {
      id: ++this.tradeCount,
      symbol: pos.symbol,
      side: pos.side,
      entryTime: pos.entryTime,
      entryPrice: pos.entryPrice,
      exitTime: new Date(candle.timestamp),
      exitPrice: exitPrice,
      quantity: pos.quantity,
      pnl: netPnl,
      pnlPercent: (netPnl / entryVol) * 100, // ROI based on invested amount
      reason,
      cumulativeBalance: this.currentBalance,
    };

    this.currentPosition = null;
    return trade;
  }
}
