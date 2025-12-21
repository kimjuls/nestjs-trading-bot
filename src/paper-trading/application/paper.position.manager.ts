import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaperPosition } from '../domain/paper-position';
import { PaperTrade } from '../domain/paper-trade';
import { PaperPortfolio } from '../domain/paper-portfolio';

@Injectable()
export class PaperPositionManager {
  private readonly logger = new Logger(PaperPositionManager.name);

  private initialBalance: number;
  private currentBalance: number;
  private openPositions: PaperPosition[] = []; // Simple array for now, assume one position per symbol usually
  private closedTrades: PaperTrade[] = [];

  // Fee rate: 0.04% (Binance default for VIP 0 Taker is 0.05%, Maker 0.02%. Using 0.04% as average/conservative)
  private readonly FEE_RATE = 0.0004;

  constructor(private configService: ConfigService) {
    const balanceConfig = this.configService.get<string>(
      'PAPER_INITIAL_BALANCE',
    );
    this.initialBalance = balanceConfig ? parseFloat(balanceConfig) : 10000;
    this.currentBalance = this.initialBalance;
  }

  // Allow re-initialization primarily for testing or reset
  init(balance: number) {
    this.initialBalance = balance;
    this.currentBalance = balance;
    this.openPositions = [];
    this.closedTrades = [];
  }

  openPosition(position: PaperPosition) {
    const margin =
      (position.entryPrice * position.quantity) / position.leverage;

    if (this.currentBalance < margin) {
      throw new BadRequestException(
        `Insufficient balance. Required: ${margin}, Available: ${this.currentBalance}`,
      );
    }

    // Deduct margin from available balance (isolated margin model simulation)
    // In cross margin, balance stays same but available down.
    // For simplicity, we deduct margin to represent "locked" funds.
    this.currentBalance -= margin;
    this.openPositions.push(position);

    this.logger.log(
      `Opened Position: ${position.side} ${position.symbol} @ ${position.entryPrice} Qty:${position.quantity}`,
    );
  }

  closePosition(symbol: string, exitPrice: number, reason: string): PaperTrade {
    const index = this.openPositions.findIndex((p) => p.symbol === symbol);
    if (index === -1) {
      throw new BadRequestException(`No open position found for ${symbol}`);
    }

    const position = this.openPositions[index];

    // 1. Calculate PnL
    const priceDiff =
      position.side === 'LONG'
        ? exitPrice - position.entryPrice
        : position.entryPrice - exitPrice;

    const grossPnl = priceDiff * position.quantity;

    // 2. Calculate Fee (Exit fee only for simplicity, or we can add entry fee too. Let's do exit fee based on full value)
    // Accurate simulation: Fee = Value * Rate
    const exitValue = exitPrice * position.quantity;
    const fee = exitValue * this.FEE_RATE;

    const netPnl = grossPnl - fee;

    // 3. Return Margin + PnL to balance
    const margin =
      (position.entryPrice * position.quantity) / position.leverage;
    this.currentBalance += margin + netPnl;

    // 4. Create Trade Record
    const trade: PaperTrade = {
      id: Date.now().toString(),
      symbol: position.symbol,
      side: position.side,
      entryPrice: position.entryPrice,
      exitPrice: exitPrice,
      quantity: position.quantity,
      pnl: netPnl,
      pnlPercent: (netPnl / margin) * 100, // ROI based on margin
      openTime: position.openTime,
      closeTime: Date.now(),
      reason: reason,
    };

    // 5. Update State
    this.openPositions.splice(index, 1);
    this.closedTrades.push(trade);

    this.logger.log(
      `Closed Position: ${position.symbol} PnL: ${netPnl.toFixed(2)} (${trade.pnlPercent.toFixed(2)}%)`,
    );

    return trade;
  }

  getPortfolio(): PaperPortfolio {
    // Calculate Unrealized PnL if needed (requires current price, skipped for basic DTO)
    const totalRealizedPnl = this.closedTrades.reduce(
      (sum, t) => sum + t.pnl,
      0,
    );

    return {
      initialBalance: this.initialBalance,
      currentBalance: this.currentBalance,
      totalPnl: totalRealizedPnl,
      totalPnlPercent:
        ((this.currentBalance - this.initialBalance) / this.initialBalance) *
        100,
      openPositions: [...this.openPositions],
      closedTrades: [...this.closedTrades],
    };
  }

  getOpenPosition(symbol: string): PaperPosition | undefined {
    return this.openPositions.find((p) => p.symbol === symbol);
  }
}
