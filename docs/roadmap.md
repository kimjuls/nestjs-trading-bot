# Roadmap & Considerations

## To Do

- [ ] @architecture.md에 있는 구성요소들에 대한 세부 설계 문서가 있어야 agent가 이해할듯. 구성요소들에 대한 세부 문서 생성 필요
- [ ] 백테스팅 방법 고민

## 추후 고려 사항 (Further Consideration)

프로젝트 발전 방향 및 기술적 개선 사항입니다.

### 성능 최적화 (Performance Optimization)

- [ ] **Fastify 적용**: NestJS의 기본 Express 어댑터 대신 Fastify를 적용하여 HTTP 처리 성능 개선.
- [ ] **비동기 처리 강화**: 실시간 데이터 스트림 처리를 위해 WebSocket과 RxJS 활용도 증대.

### 데이터베이스 및 인프라 (Database & Infrastructure)

- [ ] **DB 도입**: 트랜잭션 로그 및 백테스트 데이터 저장을 위해 PostgreSQL, MongoDB, 또는 Redis 도입 고려.
- [ ] **마이그레이션**: 장기적으로 고성능 처리가 필요한 핵심 로직의 경우 Golang으로 마이그레이션 검토.

### 테스트 및 품질 보증 (Testing & QA)

- [ ] **테스트 커버리지**: Jest 기반의 Unit Test 및 E2E Test 강화.
- [ ] **백테스팅 엔진**: 과거 데이터를 기반으로 전략을 검증할 수 있는 정교한 시뮬레이션 환경 구축.
