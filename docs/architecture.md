# Architecture

## 아키텍처 설계 (Architecture)

### 모듈 구조 (Directory Structure)

```text
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

### 모듈 상세 설명 (Module Details)

#### **1️⃣ `config` (설정)**

- `.env` 파일을 기반으로 API Key, 비밀키, 거래소 설정 등을 로드합니다.
- API 키, 레버리지, 기본 설정값 등을 중앙에서 관리합니다.

#### **2️⃣ `exchange` (거래소 API 연동)**

- REST API 및 WebSocket 연동을 담당합니다.
- 주문 실행(`placeOrder`), 포지션 조회(`getPosition`), 실시간 가격 스트리밍 등을 처리합니다.

#### **3️⃣ `strategy` (트레이딩 전략)**

- 매매 시그널 생성 (MACD, RSI, 볼린저밴드 등) 및 백테스트(`backtest()`) 로직을 포함합니다.
- 진입 및 청산 결정 로직을 구현합니다.

#### **4️⃣ `risk` (리스크 관리)**

- 스탑로스(Stop Loss), 테이크프로핏(Take Profit) 설정을 담당합니다.
- 자금 관리 및 레버리지 조절을 통해 리스크를 최소화합니다.

#### **5️⃣ `execution` (주문 실행 엔진)**

- 실제 주문 실행 및 취소(`executeTrade()`)를 수행합니다.
- 거래소 API 응답 처리 및 슬리피지(Slippage) 대응 로직을 포함합니다.

#### **6️⃣ `monitoring` (거래 모니터링)**

- 시스템 로그 저장 및 에러 감지를 수행합니다.
- 텔레그램, 디스코드 등을 통한 실시간 알림 기능을 제공합니다.

---

### Workflow

**📌 트레이딩봇 실행 흐름 (시그널 기반 매매 예시)**

1. **Exchange**: `exchange` 모듈에서 실시간 가격 데이터를 WebSocket으로 수신합니다.
2. **Strategy**: `strategy` 모듈에서 수신된 데이터를 분석하여 매매 시그널(Signal)을 생성합니다.
3. **Risk Management**: `risk` 모듈에서 현재 자산 상태와 리스크를 고려하여 주문 크기 및 스탑로스를 설정합니다.
4. **Execution**: `execution` 모듈에서 최종 승인된 주문을 API를 통해 거래소에 실행합니다.
5. **Monitoring**: `monitoring` 모듈에서 주문 내역을 기록하고, 사용자에게 알림(텔레그램/디스코드)을 전송합니다.
