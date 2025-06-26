# 🎰 로또 번호 추천 API (TypeScript + Clean Architecture)

Node.js(TypeScript) + Express + PostgreSQL + OpenAI GPT를 사용하는 AI 기반 로또 번호 추천 웹서비스입니다.

## ✨ 주요 기능

### 🆓 무료 번호 추천 API (`/api/recommend/free`)
- GPT-3.5-turbo 사용
- 사용자 조건 기반 추천 (제외번호, 포함번호, 최근구매이력, 선호사항)
- 회차별 추천 저장

### 💎 프리미엄 번호 추천 API (`/api/recommend/premium`)
- GPT-4o 사용
- 이미지 기반 번호 추출 및 분석 지원
- 고급 패턴 분석 및 전략 제공

### 📷 이미지 번호 추출 API (`/api/image/extract`)
- GPT-4o Vision으로 로또 용지/번호표에서 번호 인식
- OCR 신뢰도 측정
- 다양한 형태의 번호 이미지 지원

### 📊 당첨번호 매칭 회고 API (`/api/review/generate`)
- 추천번호와 실제 당첨번호 비교 분석
- AI 기반 패턴 분석 및 개선점 제시
- 성공/실패 요인 분석

### 🏗️ Clean Architecture 구조
- **Entities**: 비즈니스 로직 핵심 객체
- **Use Cases**: 애플리케이션 비즈니스 규칙
- **Repositories**: 데이터 액세스 추상화
- **Controllers**: API 요청/응답 처리
- **Prompts**: GPT 프롬프트 템플릿 관리

## 🚀 빠른 시작

### 전제 조건
- Docker & Docker Compose
- Node.js 18+ (로컬 개발시)

### 1. 환경 설정
```bash
# 프로젝트 클론
git clone <repository-url>
cd api-ai645-node

# 환경변수 설정 (OpenAI API 키 필요)
cp backend/env.example backend/.env
# backend/.env 파일에서 OPENAI_API_KEY 설정
```

### 2. 🐳 Docker로 실행 (권장)

#### 기본 도커 명령어
```bash
# 개발 환경 시작
docker compose up -d

# 백그라운드에서 실행하면서 로그 확인
docker compose up -d && docker compose logs -f

# 서비스 중지
docker compose down

# 서비스 중지 및 볼륨 삭제 (데이터 초기화)
docker compose down -v
```

#### 편의 스크립트 사용
```bash
# 초기 설정 및 시작
./scripts/dev.sh setup    # 초기 설정
./scripts/dev.sh start    # 서비스 시작
./scripts/dev.sh health   # 상태 확인
./scripts/dev.sh stop     # 서비스 중지
```

#### 개별 서비스 관리
```bash
# 백엔드만 재시작
docker compose restart backend

# 데이터베이스만 재시작
docker compose restart db

# 특정 서비스 로그 확인
docker compose logs -f backend
docker compose logs -f db

# 컨테이너 상태 확인
docker compose ps
```

### 3. 로컬 개발
```bash
cd backend
npm install
npx prisma generate
npm run dev
```

## 🔧 접속 정보

| 서비스 | URL | 포트 |
|--------|-----|------|
| Backend API | http://localhost:3350 | 3350 |
| API 문서 | http://localhost:3350/api-docs | 3350 |
| Health Check | http://localhost:3350/health | 3350 |
| PostgreSQL | localhost:3236 | 3236 |

## 📁 프로젝트 구조

```
api-ai645-node/
├── docker-compose.yml              # 개발환경 Docker 설정
├── docker-compose.prod.yml         # 프로덕션 Docker 설정
├── .dockerignore                   # Docker 제외 파일
├── scripts/dev.sh                  # 개발 편의 스크립트
├── examples/api-examples.md        # API 사용 예제
└── backend/                        # TypeScript 백엔드
    ├── src/
    │   ├── entities/               # 도메인 엔티티
    │   │   ├── RecommendationHistory.ts
    │   │   ├── RecommendationReview.ts
    │   │   └── WinningNumbers.ts
    │   ├── repositories/           # 데이터 액세스 인터페이스
    │   │   ├── IRecommendationHistoryRepository.ts
    │   │   ├── IRecommendationReviewRepository.ts
    │   │   ├── IWinningNumbersRepository.ts
    │   │   └── IGPTService.ts
    │   ├── usecases/              # 비즈니스 로직 (구현 예정)
    │   ├── controllers/           # API 컨트롤러 (구현 예정)
    │   ├── routes/               # API 라우트 (구현 예정)
    │   ├── prompts/              # GPT 프롬프트 템플릿
    │   │   ├── freeRecommendationPrompt.ts
    │   │   ├── premiumRecommendationPrompt.ts
    │   │   ├── imageExtractionPrompt.ts
    │   │   └── reviewPrompt.ts
    │   ├── config/               # 설정 파일
    │   │   ├── env.ts
    │   │   ├── database.ts
    │   │   └── test-setup.ts
    │   ├── types/                # TypeScript 타입 정의
    │   │   └── common.ts
    │   └── index.ts              # 애플리케이션 진입점
    ├── prisma/
    │   └── schema.prisma         # 데이터베이스 스키마
    ├── Dockerfile                # 개발용 Dockerfile
    ├── Dockerfile.prod           # 프로덕션용 Dockerfile
    ├── package.json
    ├── tsconfig.json
    ├── jest.config.js
    ├── .eslintrc.js
    └── .prettierrc
```

## 🎯 API 사용 예제

### 무료 번호 추천
```bash
curl -X POST http://localhost:3350/api/recommend/free \
  -H "Content-Type: application/json" \
  -d '{
    "round": 1105,
    "conditions": {
      "excludeNumbers": [1, 2, 3],
      "includeNumbers": [7, 14],
      "preferences": "홀수 번호를 선호합니다"
    }
  }'
```

### 프리미엄 이미지 기반 추천
```bash
curl -X POST http://localhost:3350/api/recommend/premium \
  -F "image=@lottery_numbers.jpg" \
  -F "data={\"round\": 1105}"
```

### 이미지 번호 추출
```bash
curl -X POST http://localhost:3350/api/image/extract \
  -F "image=@lottery_ticket.jpg"
```

## 🗄️ 데이터베이스 구조

### 주요 테이블
- `recommendation_history`: 추천 내역 저장
- `recommendation_review`: 회고 분석 결과
- `winning_numbers`: 당첨번호 데이터
- `api_usage`: API 사용량 통계

### 데이터베이스 관리
```bash
# Prisma 마이그레이션
docker compose exec backend npx prisma migrate dev

# Prisma Studio (DB 관리 UI)
docker compose exec backend npx prisma studio

# 데이터베이스 직접 접속
docker compose exec db psql -U postgres -d main
```

## 🛠️ 개발 도구

### 코드 품질
```bash
# TypeScript 컴파일
npm run build

# 린팅
npm run lint
npm run lint:fix

# 포매팅
npm run format

# 테스트
npm test
npm run test:watch
```

### Docker 명령어

#### 🚀 서비스 관리
```bash
# 전체 서비스 시작
docker compose up -d

# 전체 서비스 중지
docker compose down

# 전체 서비스 중지 및 볼륨 삭제 (데이터 초기화)
docker compose down -v

# 서비스 재시작
docker compose restart

# 특정 서비스 재시작
docker compose restart backend
docker compose restart db

# 도커 재시작
docker compose down
docker compose build --no-cache
docker compose up -d
```

#### 📊 모니터링
```bash
# 전체 로그 확인
docker compose logs -f

# 특정 서비스 로그
docker compose logs -f backend
docker compose logs -f db

# 컨테이너 상태 확인
docker compose ps

# 리소스 사용량 확인
docker stats
```

#### 🔧 개발 도구
```bash
# 백엔드 컨테이너에 접속
docker compose exec backend sh

# 데이터베이스에 직접 접속
docker compose exec db psql -U postgres -d main

# Prisma 마이그레이션 실행
docker compose exec backend npx prisma migrate dev

# Prisma Studio 실행 (DB 관리 UI)
docker compose exec backend npx prisma studio
```

#### 🧹 정리
```bash
# 사용하지 않는 컨테이너/이미지 정리
docker system prune

# 모든 컨테이너, 이미지, 볼륨 삭제 (주의!)
docker system prune -a --volumes
```

## 🔒 환경변수

### 필수 환경변수
```bash
DATABASE_URL=postgres://postgres:postgres@db:5432/main
OPENAI_API_KEY=your-openai-api-key-here
JWT_SECRET=your-jwt-secret-key
```

### 선택 환경변수
```bash
NODE_ENV=development
PORT=3350
LOG_LEVEL=debug
CORS_ORIGIN=http://localhost:3000
API_VERSION=v1
```

## 📈 배포

### 프로덕션 배포
```bash
# 프로덕션 환경변수 설정
cp backend/env.example backend/.env.production

# 프로덕션 배포
docker compose -f docker-compose.prod.yml up -d

# 배포 확인
curl http://localhost:3350/health
```

## 🧪 테스트

### API 테스트
- 상세한 API 사용 예제: `examples/api-examples.md`
- Postman 컬렉션 제공
- 자동화된 curl 스크립트

### 단위 테스트
```bash
# 테스트 실행
npm test

# 커버리지 확인
npm run test:coverage
```

## 🔧 문제 해결

### 일반적인 문제

1. **Prisma 관련 오류**
   - 현재 데이터베이스 연결이 임시로 비활성화됨
   - ARM64 Alpine Linux 호환성 문제 해결 중

2. **포트 충돌**
   ```bash
   lsof -i :3350  # 백엔드 포트 확인
   lsof -i :3236  # DB 포트 확인
   ```

3. **컨테이너 재시작 루프**
   ```bash
   docker compose logs --tail=50 backend
   ```

## 🤝 기여하기

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다.

## 🆘 지원

문제가 발생하면 다음을 확인해주세요:
1. Docker와 Docker Compose 버전
2. 환경변수 설정 (특히 OPENAI_API_KEY)
3. 포트 충돌 여부
4. 컨테이너 로그 및 상태

---

🎰 **Happy Lottery Number Recommending!** 🍀

## 🐳 Docker 환경 분리 (개발/배포)

### 개발 환경 (코드 실시간 반영)
```bash
docker compose up -d
```
- `docker-compose.yml` + `docker-compose.override.yml`가 자동 적용됨
- 볼륨 마운트로 소스코드 변경이 바로 반영됨

### 배포 환경 (빌드된 코드만 사용)
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
- 볼륨 마운트 없이 빌드된 코드만 사용
- 배포용 환경변수, 설정 적용

---

## 예시 파일 구조

- `docker-compose.yml`: 공통 설정
- `docker-compose.override.yml`: 개발용(볼륨 마운트 등)
- `docker-compose.prod.yml`: 배포용(볼륨 마운트 없음, prod 환경변수)

---

## 예시

### docker-compose.yml (공통)
```yaml
version: '3.8'
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: api-backend
    ports:
      - "3350:4000"
    environment:
      - NODE_ENV=development
    env_file:
      - ./backend/.env
    depends_on:
      - db
    networks:
      - app-network
    command: npm run start
  db:
    image: postgres:15
    # ...
```

### docker-compose.override.yml (개발)
```yaml
services:
  backend:
    volumes:
      - ./backend:/app
      - /app/node_modules
```

### docker-compose.prod.yml (배포)
```yaml
services:
  backend:
    environment:
      - NODE_ENV=production
    # 볼륨 마운트 없음
```