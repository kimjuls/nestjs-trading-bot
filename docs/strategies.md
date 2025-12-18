# Trading Strategies

## 트레이딩 전략 (Trading Strategies)

이 프로젝트는 다양한 트레이딩 전략을 플러그인 형태로 확장할 수 있도록 설계되었습니다.

### 적용 전략 (Implemented Strategies)

#### 1. MACD + RSI 필터 전략 (MACD + RSI Filter Strategy)

**추세 추종(Trend Following)** 전략에 **모멘텀(Momentum)** 필터를 결합한 매매법입니다. MACD로 추세의 방향(엔진)을 파악하고, RSI로 과열 여부(브레이크)를 판단하여 진입 시점을 결정합니다.

##### A. 기본 개념 (Core Concepts)

- **MACD (엔진)**: 추세의 방향을 알립니다.
  - **골든크로스**: MACD 선이 시그널 선을 상향 돌파 → **상승 추세 (매수 신호)**
  - **데드크로스**: MACD 선이 시그널 선을 하향 돌파 → **하락 추세 (매도 신호)**
- **RSI (안전장치)**: 가격의 과열 여부를 판단합니다.
  - **70 이상**: 과매수 (진입 자제)
  - **30 이하**: 과매도 (반등 가능성)

##### B. 매매 로직 (Trading Logic)

**매수 진입 (Entry - Long Position)**
두 가지 조건이 **동시에(AND)** 만족될 때 진입합니다.

1. **조건 1 (방향)**: MACD 골든크로스 발생.
2. **조건 2 (안전장치)**: RSI 70 미만.
   > _해석: 상승 추세가 시작되었으나, 아직 가격이 과열된 상태는 아님._

**매수 청산 (Exit - Long Position)**
다음 중 하나라도 해당되면 매도합니다.

1. **익절(Take Profit)**: 진입가 대비 **+X%** 수익 달성.
2. **손절(Stop Loss)**: 진입가 대비 **-Y%** 손실 발생.
3. **추세 반전**: MACD 데드크로스 발생.

**매도 진입 (Entry - Short Position)**
두 가지 조건이 **동시에(AND)** 만족될 때 진입합니다.

1. **조건 1 (방향)**: MACD 데드크로스 발생.
2. **조건 2 (안전장치)**: RSI 30 초과.
   > _해석: 하락 추세가 시작되었으나, 아직 가격이 과매도된 상태는 아님._

**매도 청산 (Exit - Short Position)**
다음 중 하나라도 해당되면 매수(포지션 종료)합니다.

1. **익절(Take Profit)**: 진입가 대비 **+X%** 수익 달성 (가격 하락).
2. **손절(Stop Loss)**: 진입가 대비 **-Y%** 손실 발생 (가격 상승).
3. **추세 반전**: MACD 골든크로스 발생.

##### C. 특징 및 조언 (Features & Tips)

- **장점**: 구현 난이도가 낮고 논리가 명확하여 초보자에게 적합합니다. 횡보장에서의 잦은 신호(Whipsaw)를 RSI 필터로 줄일 수 있습니다.
- **팁**: 1분/5분 봉은 노이즈가 심하므로, **15분 또는 1시간 봉** 사용을 권장합니다.

### 전략 개발 가이드 (How to Implement Custom Strategy)

새로운 전략을 추가하려면 `strategy` 모듈의 인터페이스를 구현해야 합니다.

```typescript
// 예시 인터페이스
interface Strategy {
  analyze(marketData: MarketData): TradeSignal;
}
```

## 성과 및 테스트 결과 (Results & Performance)

_(백테스팅 결과 및 실전 매매 성과는 추후 업데이트될 예정입니다.)_

- 수익률 (ROI)
- 최대 낙폭 (MDD, Max Drawdown)
- 승률 (Win Rate)
