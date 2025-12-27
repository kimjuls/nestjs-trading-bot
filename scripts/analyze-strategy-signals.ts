import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BinanceHistoricalLoader } from '../src/backtest/infrastructure/binance.historical.loader';
import { MacdHistogramStrategy } from '../src/strategy/strategies/macd-histogram.strategy';
import { Candle } from '../src/exchange/dto/candle';
import { TradingAction } from '../src/strategy/enums/trading-action.enum';

async function bootstrap() {
  const moduleRef = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ envFilePath: '.env' })],
    providers: [BinanceHistoricalLoader],
  }).compile();

  const loader = moduleRef.get<BinanceHistoricalLoader>(
    BinanceHistoricalLoader,
  );

  const symbol = 'BTCUSDT';
  // Check 1h
  await runAnalysis(
    loader,
    new MacdHistogramStrategy(),
    symbol,
    '1h',
    '2025-06-01',
    '2025-12-01',
  );

  // Check 15m
  await runAnalysis(
    loader,
    new MacdHistogramStrategy(),
    symbol,
    '15m',
    '2025-06-01',
    '2025-12-01',
  );
}

async function runAnalysis(
  loader: BinanceHistoricalLoader,
  strategy: MacdHistogramStrategy,
  symbol: string,
  interval: string,
  startDate: string,
  endDate: string,
) {
  console.log(
    `\n--- Analyzing ${symbol} ${interval} (${startDate} ~ ${endDate}) ---`,
  );

  const start = new Date(startDate);
  const end = new Date(endDate);

  console.log('Fetching candles...');
  const candles = await loader.loadCandles(symbol, interval, start, end);
  console.log(`Fetched ${candles.length} candles.`);

  if (candles.length === 0) {
    console.log('No candles found.');
    return;
  }

  await strategy.onInit();

  let signalCount = 0;
  let longCount = 0;
  let shortCount = 0;
  const signals: any[] = [];
  const debugLogs: string[] = [];

  // Simulate backtest loop: Feed candles step-by-step
  // We need to keep a growing buffer of candles because strategy considers new candles added to array
  const currentCandles: Candle[] = [];

  // Pre-fill some history if needed? Strategy handles first few candles as initialization

  for (let i = 0; i < candles.length; i++) {
    currentCandles.push(candles[i]);

    // Call strategy
    const signal = await strategy.analyze(currentCandles);

    if (signal.action !== TradingAction.Hold) {
      signalCount++;
      if (signal.action === TradingAction.EnterLong) longCount++;
      if (signal.action === TradingAction.EnterShort) shortCount++;

      const log = `[${new Date(signal.timestamp).toISOString()}] Signal: ${TradingAction[signal.action]} @ ${signal.price} (Reason: ${signal.metadata?.reason}, Hist: ${signal.metadata?.histogram})`;
      console.log(log);
      signals.push(signal);
    }
  }

  console.log(`Total Signals: ${signalCount}`);
  console.log(`Longs: ${longCount}, Shorts: ${shortCount}`);
}

bootstrap();
