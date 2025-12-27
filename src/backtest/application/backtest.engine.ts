import { Inject, Injectable, Logger } from '@nestjs/common';
import { BacktestConfig } from '../domain/backtest.config';
import {
  BacktestResult,
  BacktestMetrics,
  EquityPoint,
} from '../domain/backtest.result';
import { HistoricalDataLoader } from '../infrastructure/historical-data.loader';
import { BacktestPositionManager } from './backtest.position.manager';
import { TradeStrategy } from '../../strategy/interfaces/trade-strategy.interface';
import { TradingAction } from '../../strategy/enums/trading-action.enum';
import { BacktestTrade } from '../domain/backtest.trade';

@Injectable()
export class BacktestEngine {
  private readonly logger = new Logger(BacktestEngine.name);

  constructor(
    @Inject('HistoricalDataLoader')
    private readonly dataLoader: HistoricalDataLoader,
    private readonly positionManager: BacktestPositionManager,
  ) {}

  async run(
    config: BacktestConfig,
    strategy: TradeStrategy,
  ): Promise<BacktestResult> {
    this.logger.log('Starting backtest...');

    // 1. Load Data
    const candles = await this.dataLoader.loadCandles(
      config.symbol,
      config.interval,
      config.startDate,
      config.endDate,
    );
    this.logger.log(`Loaded ${candles.length} candles.`);

    // 2. Initialize
    this.positionManager.reset(config);
    if (strategy.onInit) {
      await strategy.onInit();
    }

    const trades: BacktestTrade[] = [];
    const equityCurve: EquityPoint[] = [];

    // Initial equity point
    equityCurve.push({
      timestamp: config.startDate,
      balance: config.initialCapital,
      drawdownPercent: 0,
    });

    // 3. Simulation Loop
    // Allow some warmup period for indicators if needed?
    // Usually strategies handle warmup or return Neutral if not enough data.
    // We pass growing window or full window?
    // "Real-time" simulation transmits current candle and past history.
    // For efficiency, usually we pass the full array and index, but TradeStrategy interface takes Candle[].
    // If we pass sliced array every time, it might be slow for large datasets.
    // But adhering to interface: analyze(candles: Candle[])

    // Optimization: If strategy needs only last N candles, we could slice.
    // But for now, let's implement the loop as per design.

    for (let i = 0; i < candles.length; i++) {
      // Optimization: Sliding window to avoid O(N^2) copying and calculation
      // Keep enough history for indicators to converge (e.g. EMA)
      const lookback = 500;
      const start = Math.max(0, i + 1 - lookback);
      const window = candles.slice(start, i + 1);
      // To optimize later, we can check if strategy allows just receiving the new candle + buffer.

      const currentCandle = candles[i];
      const signal = await strategy.analyze(window);

      // Handle Signals & Position Management
      const currentPos = this.positionManager.getCurrentPosition();
      let trade: BacktestTrade | null = null;
      let reason = '';

      // 1. Check for Exits / Reversals first
      if (currentPos) {
        let shouldExit = false;

        // Explicit Exit Signals
        if (
          currentPos.side === 'LONG' &&
          signal.action === TradingAction.ExitLong
        ) {
          shouldExit = true;
          reason = 'Signal Exit (ExitLong)';
        } else if (
          currentPos.side === 'SHORT' &&
          signal.action === TradingAction.ExitShort
        ) {
          shouldExit = true;
          reason = 'Signal Exit (ExitShort)';
        }

        // Reversal Signals
        if (!shouldExit) {
          if (
            currentPos.side === 'LONG' &&
            signal.action === TradingAction.EnterShort
          ) {
            shouldExit = true;
            reason = 'Reversal (EnterShort)';
          } else if (
            currentPos.side === 'SHORT' &&
            signal.action === TradingAction.EnterLong
          ) {
            shouldExit = true;
            reason = 'Reversal (EnterLong)';
          }
        }

        if (shouldExit) {
          trade = this.positionManager.closePosition(currentCandle, reason);
          trades.push(trade);
        }
      }

      // 2. Check for Entries (only if no position exists, or we just closed one)
      // Note: If we just reversed, trade is not null, but currentPos is now null (in manager).
      // We need to fetch currentPos again or trust that manager.getCurrentPosition() is null.
      const updatedPos = this.positionManager.getCurrentPosition();

      if (!updatedPos) {
        if (signal.action === TradingAction.EnterLong) {
          this.positionManager.openPosition(
            'LONG',
            currentCandle,
            this.positionManager.getCurrentBalance(),
          );
        } else if (signal.action === TradingAction.EnterShort) {
          this.positionManager.openPosition(
            'SHORT',
            currentCandle,
            this.positionManager.getCurrentBalance(),
          );
        }
      }

      // Record Equity (Mark to Market could be better, but realized balance is simpler for now)
      // If we want MTM, we need to value open position.
      // For now, let's just log realized balance + current pos value?
      // Let's stick to realized balance for simplicity, or MTM if easy.

      // MTM Balance:
      let currentBalance = this.positionManager.getCurrentBalance();
      // If open position, add unrealized PnL
      if (currentPos) {
        const close = currentCandle.close;
        const entry = currentPos.entryPrice;
        const diff = currentPos.side === 'LONG' ? close - entry : entry - close;
        currentBalance += diff * currentPos.quantity;
      }

      equityCurve.push({
        timestamp: new Date(currentCandle.timestamp),
        balance: currentBalance,
        drawdownPercent: 0, // Calculated later
      });
    }

    // Close any open position at the end
    const finalPos = this.positionManager.getCurrentPosition();
    if (finalPos) {
      const lastCandle = candles[candles.length - 1];
      const trade = this.positionManager.closePosition(
        lastCandle,
        'End of Backtest',
      );
      trades.push(trade);

      // Update last equity point
      equityCurve[equityCurve.length - 1].balance =
        this.positionManager.getCurrentBalance();
    }

    // 4. Calculate Metrics & Drawdown
    this.calculateDrawdown(equityCurve);
    const metrics = this.calculateMetrics(config, trades, equityCurve);

    return {
      config,
      trades,
      metrics,
      equityCurve,
    };
  }

  private calculateDrawdown(equityCurve: EquityPoint[]) {
    let peak = -Infinity;
    for (const point of equityCurve) {
      if (point.balance > peak) peak = point.balance;
      const dd = ((peak - point.balance) / peak) * 100;
      point.drawdownPercent = dd;
    }
  }

  private calculateMetrics(
    config: BacktestConfig,
    trades: BacktestTrade[],
    equityCurve: EquityPoint[],
  ): BacktestMetrics {
    const totalTrades = trades.length;
    const winningTrades = trades.filter((t) => t.pnl > 0).length;
    const losingTrades = trades.filter((t) => t.pnl <= 0).length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    const totalPnl =
      equityCurve[equityCurve.length - 1].balance - config.initialCapital;
    const totalPnlPercent = (totalPnl / config.initialCapital) * 100;

    const maxDrawdown = equityCurve.reduce(
      (max, p) => Math.max(max, p.drawdownPercent),
      0,
    );

    const wins = trades.filter((t) => t.pnl > 0).map((t) => t.pnl);
    const losses = trades.filter((t) => t.pnl <= 0).map((t) => t.pnl);
    const avgWin =
      wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
    const avgLoss =
      losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;

    const profitFactor =
      Math.abs(avgLoss) > 0
        ? wins.reduce((a, b) => a + b, 0) /
          Math.abs(losses.reduce((a, b) => a + b, 0))
        : wins.length > 0
          ? Infinity
          : 0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalPnl,
      totalPnlPercent,
      averageWin: avgWin,
      averageLoss: avgLoss,
      profitFactor,
      maxDrawdown,
      maxDrawdownPercent: maxDrawdown,
    };
  }
}
