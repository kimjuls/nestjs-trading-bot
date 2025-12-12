export class TradingSignal {
  /**
   * The action to take (e.g. 'BUY', 'SELL', 'HOLD', 'CLOSE').
   * TODO: Define enum for actions.
   */
  action: string;

  /**
   * The price at which the signal was generated.
   */
  price: number;

  /**
   * Timestamp when the signal was generated.
   */
  timestamp: number;

  /**
   * Reason/Metadata regarding the signal.
   */
  metadata?: Record<string, any>;
}
