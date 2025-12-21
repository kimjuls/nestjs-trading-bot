import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaperPositionManager } from './application/paper.position.manager';
import { PaperExchangeClient } from './application/paper.exchange.client';
import { ExchangeModule } from '../exchange/exchange.module';
// Note: PaperExchangeClient needs 'MarketStream' which is exported by ExchangeModule.
// So PaperTradingModule imports ExchangeModule?
// Circular dependency risk if ExchangeModule imports PaperTradingModule.
// Solution:
// 1. Move MarketStream to a Core/Shared module?
// 2. Or use forwardRef.
// 3. Or PaperExchangeClient uses interface and we assume it's provided in scope?
//    But PaperTradingModule compiles its providers. It needs MarketStream token.
//    If PaperTradingModule imports ExchangeModule, it gets MarketStream.
//    Then ExchangeModule cannot import PaperTradingModule to use PaperExchangeClient.
//
// Better Design:
// ExchangeModule (Core) -> provides MarketStream (Base)
// PaperTradingModule -> imports ExchangeModule (for MarketStream), provides PaperExchangeClient.
// AppModule -> imports ExchangeModule.
//
// But ExecutionModule needs 'ExchangeClient'.
// If ExchangeModule provides 'ExchangeClient' using PaperExchangeClient, it implies dependency.
//
// Maybe we assume PaperExchangeClient is JUST a class provided in ExchangeModule?
// But it needs PaperPositionManager which is in PaperTradingModule.
//
// Let's do:
// ExchangeModule imports PaperTradingModule.
// PaperTradingModule exports PaperExchangeClient.
// PaperExchangeClient needs MarketStream.
// We can use forwardRef(() => ExchangeModule) in PaperTradingModule.
//
// Or better:
// Extract 'MarketStream' related stuff to 'MarketDataModule' (ExchangeModule minus Client).
// But for now refactoring is big.
//
// Let's force forwardRef.

import { forwardRef } from '@nestjs/common';

@Module({
  imports: [ConfigModule, forwardRef(() => ExchangeModule)],
  providers: [PaperPositionManager, PaperExchangeClient],
  exports: [PaperExchangeClient, PaperPositionManager],
})
export class PaperTradingModule {}
