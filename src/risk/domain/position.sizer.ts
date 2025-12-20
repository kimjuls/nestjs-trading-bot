export interface PositionSizer {
  /**
   * 자산 정보와 진입/손절가를 기반으로 적절한 진입 수량을 계산합니다.
   *
   * @param totalEquity 총 자산 규모
   * @param entryPrice 진입 가격
   * @param stopLossPrice 손절 가격
   * @returns 계산된 진입 수량 (소수점 처리는 exchange 규칙 따름, 여기선 raw value)
   */
  calculate(
    totalEquity: number,
    entryPrice: number,
    stopLossPrice: number,
  ): number;
}
