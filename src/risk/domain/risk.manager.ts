import { OrderRequest, OrderSide } from './structures';

// TODO: exchange 모듈 구현 시 정확한 타입을 import 해야 함.
// 현재는 의존성 관계상 여기서 간단히 정의하거나 any로 대체하지 않고
// 필요한 최소한의 인터페이스만 정의하여 사용.
export interface AccountBalance {
  totalEquity: number; // 총 자산 (실현 손익 + 미실현 손익 포함)
  availableBalance: number; // 주문 가능 그
}

export interface TradeSignal {
  symbol: string;
  side: OrderSide;
  entryPrice: number;
  stopLossPrice?: number; // 전략이 제안한 SL (없으면 Risk 모듈이 계산)
  takeProfitPrice?: number; // 전략이 제안한 TP (없으면 Risk 모듈이 계산)
}

export interface RiskManager {
  /**
   * 전략의 매매 신호와 현재 계좌 상태를 기반으로 최종 주문을 생성 및 검증합니다.
   * 리스크 정책에 위배되면 에러를 던집니다.
   */
  evaluate(signal: TradeSignal, balance: AccountBalance): Promise<OrderRequest>;
}
