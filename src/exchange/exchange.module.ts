import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BinanceMarketStream } from './infrastructure/binance.market.stream';
import { BinanceExchangeClient } from './infrastructure/binance.exchange.client';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';
import { PaperExchangeClient } from '../paper-trading/application/paper.exchange.client';

@Module({
  imports: [ConfigModule, forwardRef(() => PaperTradingModule)],
  providers: [
    {
      provide: 'MarketStream',
      useClass: BinanceMarketStream,
    },
    BinanceExchangeClient,
    {
      provide: 'ExchangeClient',
      inject: [ConfigService, BinanceExchangeClient, PaperExchangeClient],
      useFactory: (
        config: ConfigService,
        binanceClient: BinanceExchangeClient,
        paperClient: PaperExchangeClient,
      ) => {
        const nodeEnv = config.get('NODE_ENV');
        const isProduction = nodeEnv === 'production';
        return isProduction ? binanceClient : paperClient;
      },
    },
  ],
  exports: ['MarketStream', 'ExchangeClient'],
})
export class ExchangeModule {}
