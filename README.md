# NestJS Trading Bot

이 프로젝트는 가상화폐(주로 BTC) 선물 거래를 위한 자동 트레이딩 봇입니다. 다양한 보조지표를 활용하여 포지션 진입 및 청산 신호를 생성하고, 거래소 API를 통해 자동으로 거래를 수행합니다.

## 📖 문서 (Documentation)

프로젝트에 대한 자세한 내용은 `docs` 폴더 내의 문서를 참고하세요.

- **[아키텍처 (Architecture)](docs/architecture.md)**: 시스템 모듈 구조 및 데이터 처리 워크플로우
- **[트레이딩 전략 (Strategies)](docs/strategies.md)**: 구현된 전략 및 커스텀 전략 개발 가이드
- **[로드맵 (Roadmap)](docs/roadmap.md)**: 향후 계획 및 기술적 고려사항

## 🚀 주요 기능 (Key Features)

- **자동 거래**: 롱/숏 포지션 자동 진입 및 청산
- **실시간 통신**: WebSocket을 통한 실시간 가격 데이터 수신 및 처리
- **확장성**: 객체 지향 설계를 통한 전략 및 거래소 모듈의 유연한 확장
- **리스크 관리**: 스탑로스, 레버리지 관리 등 리스크 최소화 기능
- **모니터링**: 텔레그램/디스코드 알림 지원

## ⚙️ 설치 및 실행 방법 (Installation & Usage)

### 사전 요구 사항 (Prerequisites)

- [Node.js](https://nodejs.org/) (Latest LTS version recommended)
- [pnpm](https://pnpm.io/)
- [NestJS CLI](https://docs.nestjs.com/)

### 설치 (Installation)

프로젝트를 로컬 환경에 복제하고 의존성을 설치합니다.

```bash
# Repository 복제
git clone git@github.com:kimjuls/nestjs-trading-bot.git
cd nestjs-trading-bot

# 패키지 설치
pnpm install --frozen-lockfile
```

### 환경 변수 설정 (Configuration)

프로젝트 루트에 `.env` 파일을 생성하고 필요한 설정을 입력하세요.

```env
# 예시 .env 파일 내용
BINANCE_API_KEY=your_api_key
BINANCE_SECRET_KEY=your_secret_key
# ... 기타 설정
```

### 실행 (Running the app)

```bash
# 개발 모드 실행
pnpm run start

# Watch 모드 (코드 변경 감지)
pnpm run start:dev

# 프로덕션 모드 실행
pnpm run start:prod
```

## 🛠 기술 스택 (Tech Stack)

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Runtime**: Node.js
- **Package Manager**: pnpm

---

_Disclaimer: 본 프로젝트는 학습 및 연구 목적으로 개발되었습니다. 실제 투자는 본인의 책임 하에 신중하게 진행하시기 바랍니다._
