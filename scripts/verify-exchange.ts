import { NestFactory } from '@nestjs/core';
import { Module, Logger } from '@nestjs/common';
import { ExchangeModule } from '../src/exchange/exchange.module';
import { MarketStream } from '../src/exchange/domain/market.stream';

@Module({
  imports: [ExchangeModule],
})
class TestModule {}

async function bootstrap() {
  const logger = new Logger('ExchangeVerification');
  const app = await NestFactory.createApplicationContext(TestModule);

  const marketStream = app.get<MarketStream>('MarketStream');

  logger.log('Starting Exchange Verification...');

  // 1. Connection check is implicit in onModuleInit

  // 2. Subscribe to Ticker
  logger.log('Subscribing to BTCUSDT Ticker...');
  marketStream.getRealtimeTicker('BTCUSDT').subscribe((ticker) => {
    logger.log(`[TICKER] ${ticker.symbol}: ${ticker.price}`);
  });

  // 3. Subscribe to Candles
  logger.log('Subscribing to BTCUSDT 1m Candles...');
  marketStream.getRealtimeCandles('BTCUSDT', '1m').subscribe((candle) => {
    logger.log(
      `[CANDLE] ${candle.symbol} ${candle.interval} O:${candle.open} C:${candle.close} Final:${candle.isFinal}`,
    );
  });

  // Run for 15 seconds then exit
  setTimeout(async () => {
    logger.log('Verification complete. Closing...');
    await app.close();
    process.exit(0);
  }, 15000);
}

bootstrap();
