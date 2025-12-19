export enum SignalType {
  Long,
  Short,
  ExitLong,
  ExitShort,
}

export interface TradeSignal {
  symbol: string;
  type: SignalType;
  price?: number;
  quantity?: number;
  reason: string;
}
