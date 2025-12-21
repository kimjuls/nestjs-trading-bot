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
      const window = candles.slice(0, i + 1); // This is slow O(N^2), but safe for now.
      // To optimize later, we can check if strategy allows just receiving the new candle + buffer.

      const currentCandle = candles[i];
      const signal = await strategy.analyze(window);

      const currentPos = this.positionManager.getCurrentPosition();

      // Handle Entries
      if (signal.action === TradingAction.EnterLong && !currentPos) {
        this.positionManager.openPosition(
          'LONG',
          currentCandle,
          this.positionManager.getCurrentBalance(),
        ); // Full Invest for simple test
      } else if (signal.action === TradingAction.EnterShort && !currentPos) {
        // Short logic if supported
        // this.positionManager.openPosition('SHORT', currentCandle, ...);
      }

      // Handle Exits
      if (currentPos) {
        let shouldExit = false;
        let reason = '';

        if (
          currentPos.side === 'LONG' &&
          signal.action === TradingAction.ExitLong
        ) {
          shouldExit = true;
          reason = 'Signal Exit';
        }
        // Add SL/TP logic here if needed or if part of Strategy logic returning Exit signal

        if (shouldExit) {
          const trade = this.positionManager.closePosition(
            currentCandle,
            reason,
          );
          trades.push(trade);
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

    const maxDrawdown = Math.max(...equityCurve.map((p) => p.drawdownPercent));

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
