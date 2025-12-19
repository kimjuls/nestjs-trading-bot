import { TradeAlertDto } from '../dto/trade-alert.dto';
import { Position } from '../../exchange/dto/position.dto';
import { Balance } from '../../exchange/dto/balance.dto';
import { Order } from '../../exchange/dto/order.dto';

export enum NotificationLevel {
  Info = 'INFO',
  Warn = 'WARN',
  Error = 'ERROR',
  Success = 'SUCCESS',
}

export interface NotificationService {
  /**
   * 일반 텍스트 메시지를 전송합니다.
   */
  sendMessage(message: string, level?: NotificationLevel): Promise<void>;

  /**
   * 거래 관련 정보를 구조화하여 전송합니다.
   */
  sendTradeAlert(tradeInfo: TradeAlertDto): Promise<void>;

  /**
   * 에러 정보를 전송합니다.
   */
  sendErrorAlert(error: Error, context?: string): Promise<void>;

  /**
   * 봇 시작 알림을 전송합니다.
   */
  sendStartupNotification(
    positions: Position[],
    balances: Balance[],
  ): Promise<void>;

  /**
   * 주문 실행 알림을 전송합니다.
   */
  sendOrderExecutionNotification(
    order: Order,
    positions: Position[],
    balances: Balance[],
  ): Promise<void>;
}
