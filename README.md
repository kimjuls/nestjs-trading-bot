# nestjs-trading-bot

이 프로젝트는 가상화폐 거래소 선물거래 자동 트레이딩 봇 프로젝트입니다. 가상화폐(주로, BTC) 선물 차트에서 여러 보조지표를 활용해 상승 Position, 하락 Position, Position 보류, 현재 Position 청산 등의 신호를 생성하고, 해당 신호에 따라 거래를 시도합니다.

## Summary

(진행중인 미완성 프로젝트로, 현재 요약할 수 없음)

## Introduction

## 배경과 목적

## 주요 기능

- 자동 롱/숏 진입 및 청산
- API와 실시간 WebSocket 통신
- 다양한 거래 전략으로 확장할 수 있는 객체 지향 설계
- 백테스팅 및 리스크 관리 기능

## 설치 및 실행 방법 (Installation & Usage)

```sh
git clone git@github.com:kimjuls/nestjs-trading-bot.git
cd nestjs-trading-bot
pnpm install --frozen-lockfile
pnpm run start
```

## 아키텍처 설계 (Architecture)

### 모듈 구조

```sh
📂 trading-bot-project
├── 📂 src
│   ├── 📂 config              # 환경 변수 및 설정 관련
│   ├── 📂 exchange            # API 연동 (주문, 조회 등)     - 핵심모듈
│   ├── 📂 strategy            # 트레이딩 전략 (시그널, 백테스트 등)  - 핵심모듈
│   ├── 📂 risk                # 리스크 관리 (스탑로스, 레버리지 등)  - 핵심모듈
│   ├── 📂 execution           # 주문 실행 엔진                  - 핵심모듈
│   ├── 📂 monitoring          # 거래 모니터링 (로그, 알림 등)      - 핵심모듈
│   ├── 📂 common              # 공통 유틸리티 (로깅, API 핸들러 등)
│   ├── main.ts                # NestJS 앱 시작점
├── 📂 test                    # 테스트 코드
├── 📂 scripts                 # 배포 및 자동화 스크립트
├── .env                       # 환경 변수 파일
├── package.json               # 프로젝트 의존성 및 설정
└── README.md                  # 프로젝트 설명
```

#### **1️⃣ `config` (설정)**

- `.env` 파일을 기반으로 API Key, 비밀키, 거래소 설정 등을 로드
- API 키, 레버리지, 기본 설정값 관리

#### **2️⃣ `exchange` (거래소 API 연동)**

- REST API, WebSocket 연동
- 주문 실행 (`placeOrder`), 포지션 조회 (`getPosition`)
- 실시간 가격 스트리밍

#### **3️⃣ `strategy` (트레이딩 전략)**

- 백테스트 및 시뮬레이션 (`backtest()`)
- 매매 시그널 (MACD, RSI, 볼린저밴드 등)
- 진입/청산 로직 구현

#### **4️⃣ `risk` (리스크 관리)**

- 스탑로스, 테이크프로핏 설정
- 자금 관리, 레버리지 조절

#### **5️⃣ `execution` (주문 실행 엔진)**

- 주문 실행, 취소 (`executeTrade()`)
- 거래소 API 응답 처리 (슬리피지 대응)

#### **6️⃣ `monitoring` (거래 모니터링)**

- 로그 저장, 에러 감지
- 텔레그램/디스코드 알림

### Workflow

**📌 트레이딩봇 실행 흐름 (시그널 기반 매매 예시)**

1. `exchange`에서 **실시간 가격 데이터**를 WebSocket으로 수신
2. `strategy`에서 가격 변화를 분석하고 **매매 시그널 생성**
3. `risk` 모듈에서 주문 크기, 스탑로스 설정 후 검토
4. `execution`에서 **API를 통해 주문 실행**
5. `monitoring`에서 주문 내역 기록 및 텔레그램/디스코드 알림

## 트레이딩 전략 (Trading Strategies)

(적용한 전략과 해당 전략을 선택한 이유

예시:
Moving Average Crossover 전략을 사용하여 진입 타이밍을 결정.
RSI 기반 과매수/과매도 탐지 기능 포함.)

## 성과 및 테스트 결과 (Results & Performance)

(봇이 실제로 수행한 거래 내역, 수익률, 위험 관리 성과, 필요하다면, 시뮬레이션 결과를 그래프로)

## Consideration

- [ ] Fastify를 적용하여 성능 개선
- [ ] 트랜잭션 로그 저장을 위해 PostgreSQL, MongoDB, Redis 등의 DB 고려
- [ ] 비동기 처리: 실시간 데이터는 WebSocket + RxJS로 핸들링
- [ ] 테스트: Jest 기반으로 백테스트 및 유닛 테스트
- [ ] Golang Migration
