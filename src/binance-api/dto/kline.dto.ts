import { Kline } from 'binance';

export class KlineDto {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;

  static from(binanceKline: Kline): KlineDto {
    return {
      openTime: binanceKline[0],
      open: binanceKline[1].toString(),
      high: binanceKline[2].toString(),
      low: binanceKline[3].toString(),
      close: binanceKline[4].toString(),
      volume: binanceKline[5].toString(),
      closeTime: binanceKline[6],
      quoteAssetVolume: binanceKline[7].toString(),
      numberOfTrades: binanceKline[8],
      takerBuyBaseAssetVolume: binanceKline[9].toString(),
      takerBuyQuoteAssetVolume: binanceKline[10].toString(),
      ignore: binanceKline[11].toString(),
    };
  }
}
