import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KlineInterval, KlinesParams, USDMClient } from 'binance';
import { KlineDto } from './dto/kline.dto';

@Injectable()
export class BinanceApiService {
  private client: USDMClient;

  constructor(private readonly configService: ConfigService) {
    const accessKey = this.configService.get<string>('BINANCE_ACCESS_KEY');
    const secretKey = this.configService.get<string>('BINANCE_SECRET_KEY');
    this.configService.get<string>('BINANCE_SECRET_KEY');
    this.client = new USDMClient({
      api_key: accessKey,
      api_secret: secretKey,
    });
  }

  async getCandles(symbol: string, interval: KlineInterval, limit: number) {
    const klineParams: KlinesParams = {
      symbol,
      interval,
      limit, // 1-100 weight 1
    };
    const klines = await this.client.getKlines(klineParams);
    return klines.map((binanceKline) => KlineDto.from(binanceKline));
  }
}
