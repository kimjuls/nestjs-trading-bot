import { TradingAction } from '../enums/trading-action.enum';

export class TradingSignal {
  /**
   * The action to take (e.g. 'ENTER_LONG', 'EXIT_LONG').
   */
  action: TradingAction;

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
