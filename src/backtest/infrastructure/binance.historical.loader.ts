import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MainClient } from 'binance';
import { Candle } from '../../exchange/dto/candle';
import { HistoricalDataLoader } from './historical-data.loader';

@Injectable()
export class BinanceHistoricalLoader implements HistoricalDataLoader {
  private readonly logger = new Logger(BinanceHistoricalLoader.name);
  private readonly client: MainClient;

  constructor(private readonly config: ConfigService) {
    this.client = new MainClient({
      api_key: this.config.get<string>('BINANCE_API_KEY'),
      api_secret: this.config.get<string>('BINANCE_API_SECRET'),
    });
  }

  async loadCandles(
    symbol: string,
    interval: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Candle[]> {
    const allCandles: Candle[] = [];
    let currentStartTime = startDate.getTime();
    const endTime = endDate.getTime();
    const limit = 1000;

    this.logger.log(
      `Fetching candles for ${symbol} (${interval}) from ${startDate.toISOString()} to ${endDate.toISOString()}...`,
    );

    while (currentStartTime < endTime) {
      // Avoid hitting rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));

      const klines = await this.client.getKlines({
        symbol,
        interval: interval as any,
        startTime: currentStartTime,
        endTime: endTime,
        limit,
      });

      if (!klines.length) break;

      const candles = klines.map((k) => this.mapToCandle(symbol, interval, k));
      allCandles.push(...candles);

      const lastCandle = klines[klines.length - 1];
      const lastCloseTime = lastCandle[6];
      currentStartTime = lastCloseTime + 1;

      if (klines.length < limit) break;
    }

    this.logger.log(`Fetched total ${allCandles.length} candles.`);
    return allCandles;
  }

  private mapToCandle(symbol: string, interval: string, data: any[]): Candle {
    return {
      symbol,
      interval,
      open: parseFloat(data[1]),
      high: parseFloat(data[2]),
      low: parseFloat(data[3]),
      close: parseFloat(data[4]),
      volume: parseFloat(data[5]),
      timestamp: data[0],
      isFinal: true, // Historical data is always final
    };
  }
}
