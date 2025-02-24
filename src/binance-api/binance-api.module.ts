import { Module } from '@nestjs/common';
import { BinanceApiService } from './binance-api.service';

@Module({
  providers: [BinanceApiService],
  exports: [BinanceApiService],
})
export class BinanceApiModule {}
