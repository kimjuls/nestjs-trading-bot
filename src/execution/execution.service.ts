import { Injectable } from '@nestjs/common';
import { BinanceApiService } from 'src/binance-api/binance-api.service';
import { Cron } from '@nestjs/schedule';
import { OrderType } from './enum/order-type.enum';

@Injectable()
export class ExecutionService {
  // TODO 단순 트레이딩 봇 제작
  /**
   * *단순 트레이딩 봇 제작*
   * 1. 1분마다 캔들 가져온 후
   * 2. 캔들로 (스토캐스틱 슬로우, MACD, ...) 지표 계산 후 매매 신호 결정(나중에 통신화, 지금은 순차로)
   * 3. 매도/매수 포지션 주문을 넣는다
   */
  constructor(private readonly binanceApiService: BinanceApiService) {}

  @Cron('10 * * * * *')
  async execute() {
    const marketSymbol = 'BTCUSDT';
    // 1. 1분마다 캔들 가져온 후
    const klines = await this.binanceApiService.getCandles(
      marketSymbol,
      '1m',
      100,
    );
    console.log(klines);

    // 2. 캔들로 (스토캐스틱 슬로우, MACD, ...) 지표 계산 후 매매 신호 결정(나중에 통신화, 지금은 순차로)
    // stochastic({
    //   period: 5,
    //   low: candles.map((candle) => parseFloat(candle.low)),
    //   high: candles.map((candle) => parseFloat(candle.high)),
    //   close: candles.map((candle) => parseFloat(candle.close)),
    //   signalPeriod: 3,
    // });

    // 3. 매도/매수 포지션 주문을 넣는다
    console.log(OrderType.Buy);
  }
}
