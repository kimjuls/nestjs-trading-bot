import { Module } from '@nestjs/common';
import { ExchangeModule } from '../exchange/exchange.module';
import { SimpleExecutionService } from './infrastructure/simple.execution.service';

@Module({
  imports: [ExchangeModule],
  providers: [
    {
      provide: 'ExecutionService',
      useClass: SimpleExecutionService,
    },
  ],
  exports: ['ExecutionService'],
})
export class ExecutionModule {}
