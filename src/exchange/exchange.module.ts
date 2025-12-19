import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BinanceMarketStream } from './infrastructure/binance.market.stream';
import { BinanceExchangeClient } from './infrastructure/binance.exchange.client';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'MarketStream',
      useClass: BinanceMarketStream,
    },
    {
      provide: 'ExchangeClient',
      useClass: BinanceExchangeClient,
    },
  ],
  exports: ['MarketStream', 'ExchangeClient'],
})
export class ExchangeModule {}
