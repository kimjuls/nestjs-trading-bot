# Trading Strategies

## 트레이딩 전략 (Trading Strategies)

이 프로젝트는 다양한 트레이딩 전략을 플러그인 형태로 확장할 수 있도록 설계되었습니다.

### 적용 전략 (Implemented Strategies)

_(현재 개발 중이거나 계획된 전략들입니다.)_

#### 1. 기술적 지표 기반 전략 (Technical Indicator Based)

- **Moving Average Crossover**: 단기/장기 이동평균선의 교차를 이용한 진입 타이밍 결정.
- **RSI (Relative Strength Index)**: 과매수/과매도 구간 탐지 및 역추세 매매.
- **Bollinger Bands**: 밴드 상단/하단 돌파 또는 회귀를 이용한 변동성 매매.

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
