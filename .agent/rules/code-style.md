---
trigger: always_on
---

Enum을 정의할 때는, 앱 내부에서만 사용하는 객체라면 `Long = 'LONG'`과 같이 굳이 문자열 값을 넣을 필요없어. 그리고 Enum 카테고리들은 PascalCase로 해줘. 예시는 다음과 같아.

```typescript
export enum SignalType {
  Long,
  Short,
  ExitLong,
  ExitShort,
}
```
