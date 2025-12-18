import { Module } from '@nestjs/common';
import { BinanceMarketStream } from './infrastructure/binance.market.stream';

@Module({
  providers: [
    {
      provide: 'MarketStream',
      useClass: BinanceMarketStream,
    },
  ],
  exports: ['MarketStream'],
})
export class ExchangeModule {}
