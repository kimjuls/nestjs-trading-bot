import { NestFactory } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BacktestModule } from '../src/backtest/backtest.module';
import { BacktestEngine } from '../src/backtest/application/backtest.engine';
import { BacktestConfig } from '../src/backtest/domain/backtest.config';
import { MacdRsiStrategy } from '../src/strategy/strategies/macd-rsi.strategy';

async function bootstrap() {
  console.log('Initializing Backtest Application...');

  // We need to import Strategy Module or provide Strategy here if it's not in BacktestModule
  // For simplicity, we manually instantiate strategy or pull from a StrategyModule if existed.
  // The MacdRsiStrategy might need dependencies.
  // Let's create a temporary app context with ConfigModule to ensure env vars are loaded.

  const app = await NestFactory.createApplicationContext(BacktestModule);
  const configService = app.get(ConfigService);
  // Note: MacdRsiStrategy might not be provided in BacktestModule.
  // We can manually instantiate it if it has no complex deps or add it to BacktestModule imports/providers dynamically or statically.
  // Simplest is generic: instantiate strategy manually if it's simple.
  // MacdRsiStrategy probably needs ConfigService if it has params.

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

  // Instantiate Strategy
  // If strategy needs DI, we should have it in a module.
  // Let's assume MacdRsiStrategy is simple for now or use a mock/simple one if connection fails.
  // Ideally, valid strategies should be in the StrategyModule and we import that.
  const strategy: any = new MacdRsiStrategy();
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
