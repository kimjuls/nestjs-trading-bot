import { NestFactory } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BacktestModule } from '../src/backtest/backtest.module';
import { BacktestEngine } from '../src/backtest/application/backtest.engine';
import { BacktestConfig } from '../src/backtest/domain/backtest.config';
import { MacdRsiStrategy } from '../src/strategy/strategies/macd-rsi.strategy';

import { MacdHistogramStrategy } from '../src/strategy/strategies/macd-histogram.strategy';

async function bootstrap() {
  console.log('Initializing Backtest Application...');

  const app = await NestFactory.createApplicationContext(BacktestModule);
  const configService = app.get(ConfigService);
  const engine = app.get(BacktestEngine);

  // Start Date: 1 month ago
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(endDate.getMonth() - 1);

  const config: BacktestConfig = {
    symbol: configService.get<string>('BACKTEST_SYMBOL') || 'BTCUSDT',
    interval: configService.get<string>('BACKTEST_INTERVAL') || '15m',
    startDate: configService.get<string>('BACKTEST_START_DATE')
      ? new Date(configService.get<string>('BACKTEST_START_DATE') as string)
      : startDate,
    endDate: configService.get<string>('BACKTEST_END_DATE')
      ? new Date(configService.get<string>('BACKTEST_END_DATE') as string)
      : endDate,
    initialCapital:
      Number(configService.get<number>('BACKTEST_INITIAL_CAPITAL')) || 10000,
    feePercent: 0.0004,
    slippagePercent: 0.0001,
  };

  console.log(`Running backtest for ${config.symbol} (${config.interval})`);
  console.log(
    `Period: ${config.startDate.toISOString()} ~ ${config.endDate.toISOString()}`,
  );

  // Instantiate Strategy based on Env
  const strategyName = configService.get<string>('TRADING_STRATEGY');
  let strategy: any;

  if (strategyName === 'MACD_RSI') {
    console.log('Using Strategy: MACD_RSI');
    strategy = new MacdRsiStrategy();
  } else {
    console.log('Using Strategy: MACD_HISTOGRAM (Default)');
    strategy = new MacdHistogramStrategy();
  }

  if (strategy.onInit) await strategy.onInit();

  try {
    const result = await engine.run(config, strategy);

    console.log(
      '\n╔════════════════════════════════════════════════════════════╗',
    );
    console.log(
      '║                   BACKTEST REPORT                          ║',
    );
    console.log(
      '╠════════════════════════════════════════════════════════════╣',
    );
    console.log(
      `║  Total Trades: ${result.metrics.totalTrades.toString().padEnd(36)}║`,
    );
    console.log(
      `║  Win Rate: ${(result.metrics.winRate.toFixed(2) + '%').padEnd(40)}║`,
    );
    console.log(
      `║  Total PnL: $${result.metrics.totalPnl.toFixed(2).padEnd(37)}║`,
    );
    console.log(
      `║  Return: ${(result.metrics.totalPnlPercent.toFixed(2) + '%').padEnd(42)}║`,
    );
    console.log(
      `║  Max Drawdown: ${(result.metrics.maxDrawdownPercent.toFixed(2) + '%').padEnd(36)}║`,
    );
    console.log(
      `║  Profit Factor: ${result.metrics.profitFactor.toFixed(2).padEnd(35)}║`,
    );
    console.log(
      '╚════════════════════════════════════════════════════════════╝\n',
    );
  } catch (error) {
    console.error('Backtest failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
