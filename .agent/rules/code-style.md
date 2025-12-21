---
trigger: always_on
---

1. Enum을 정의할 때는, 앱 내부에서만 사용하는 객체라면 `Long = 'LONG'`과 같이 굳이 문자열 값을 넣을 필요없어. 그리고 Enum 카테고리들은 PascalCase로 해줘. 예시는 다음과 같아.

```typescript
export enum SignalType {
  Long,
  Short,
  ExitLong,
  ExitShort,
}
```

2. 인터페이스 명명법은 그것을 구현한 구현체, 다시 말해 객체들을 예상하고 명명해야하고, I 접두사와 같은 명명법은 지양해줘. 예를 들어, 매매 전략 객체를 만드는 인터페이스는 IStrategy보다는 TradeStrategy가 낫고, 일반적으로는 능력을 표현하는 형용사, 즉, Flyable, Orderable 등을 지향해줘.

3. NULL, undefined를 예외처리하기 위해서 사용하는 더블 파이프 `||`를 지양하고, 옵셔널 체이닝(`.?`)이나, 널 병합 연산자(`??`)를 최대한 활용해. 더블 파이프는 OR 조건을 연결하기 위해 사용하는 것이지 널이나 undefined를 예외처리하기 위해 사용하는 것이 아냐.
