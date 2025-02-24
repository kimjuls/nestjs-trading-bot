import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ExecutionModule } from './execution/execution.module';
import { BinanceApiModule } from './binance-api/binance-api.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ExecutionModule,
    BinanceApiModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
