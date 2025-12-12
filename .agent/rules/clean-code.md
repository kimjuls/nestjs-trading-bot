---
trigger: always_on
---

1. 주석을 자제하고, any 타입을 지양하며, 함수명, 변수명, 클래스명 등 요소의 이름과 그것들의 흐름에서 자연스럽게 읽히게 해야해.

예를 들면 다음과 같이 주석을 활용하기 보다는,

```
export interface TradeStrategy {
  /**
   * Analyze the market data and return a trading signal.
   * Note: Return type and parameters will be defined in detail later.
   */
  analyze(marketData: any): Promise<any>;

  /**
   * Optional: Initialize the strategy (e.g. load indicators).
   */
  onInit?(): Promise<void>;
}

```

다음과 같이, 최대한 any 타입 대신 의미를 담은 DTO와 같은 객체로 구현해줘. 추후 구현 계획과 같은 임시 주석은 일단 괜찮아. 다음과 같은 경우는 Candle과 TradingSignal에 뭐가 들어갈지 모르니 해당 클래스에 주석이 들어갈 수 있지. onInit도 마찬가지이고.

```
export interface TradeStrategy {
  analyze(candles: Candle[]): Promise<TradingSignal>;

  /**
   * Optional: Initialize the strategy (e.g. load indicators).
   */
  onInit?(): Promise<void>;
}

```
