import { Module } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { BinanceApiModule } from 'src/binance-api/binance-api.module';

@Module({
  imports: [BinanceApiModule],
  providers: [ExecutionService],
})
export class ExecutionModule {}
