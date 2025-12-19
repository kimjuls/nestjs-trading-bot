---
trigger: always_on
---

코드를 작성하기 전에 jest 테스트 코드를 먼저 .spec.ts에 작성하고, 테스트를 진행해가며 개발해.
별도로 스크립트를 작성하지말고 테스트 코드 파일에 정의하면 되는거야.
describe에는 "무엇"이, it에는 "어떠해야한다"가 입력되면 돼.
다음은 그 예시야.

```typescript
describe('ExampleClass', () => {
  it('should be defined', () => {});
  it('should return a User entity or NULL', () => {});
  it('should throw a 404 Not Found error when the id param is omitted', () => {});
});
```
