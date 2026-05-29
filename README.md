# 🔮 포포춘 백엔드 (TypeScript + Clean Architecture)

Node.js(TypeScript) + Express + PostgreSQL 기반의 포포춘 운세 상담/문서 리포트 서비스 백엔드입니다.

## ✨ 주요 기능

현재 핵심은 운세 결제, 세션 생성, 결과 조회, 채팅형 상담, 게시판/설정 흐름입니다.

### 🔮 포포춘 운세 API (`/api/v1/fortune/*`)
- **문서형 리포트**: 결제 준비, 세션 생성, 결과 조회, 재생성
- **채팅형 상담**: 무료/유료 진입, 계정 귀속 세션, 메시지 전송
- **결제/구매내역**: 결제 상태 조회, 구매내역/상세 조회, 취소 처리
- **결과 연결**: `resultToken`, `PaymentDetail.documentId`, `Order.metadata` 기반 결과 접근

### 👑 관리자 API (`/api/admin/*`)
- **사용자 관리**: 전체 사용자 목록 조회, 역할 변경
- **통계 조회**: API 사용량, 시스템 상태, 비용 분석
- **권한 제어**: 관리자 전용 기능 접근 제한

### 📋 지원/공지 API
- **공지사항 (`/api/board/*`)**: 공지사항 목록/상세 조회, 관리자 작성/수정/삭제
- **FAQ (`/api/v1/support/faqs`)**: 결제/문서/채팅/계정/서비스 FAQ 제공
- **문의 정책**: 건의사항/제휴문의는 프론트에서 카카오 채널로 연결

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

# 환경변수 파일 생성
# backend/.env 파일을 직접 만들고 OPENAI_API_KEY / GEMINI_API_KEY / JWT_SECRET 등을 설정
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

### 🔥 Hot Reload (개발 모드)
개발 환경에서는 코드 변경 시 자동으로 서버가 재시작됩니다.

```bash
# 개발 모드로 실행 (hot reload 활성화)
docker compose up -d

# 코드 변경 후 자동 재시작 확인
# TypeScript 파일(.ts) 수정 시 자동으로 ts-node-dev가 재시작
```

**Hot Reload가 작동하는 경우:**
- TypeScript 소스 코드 수정
- 프롬프트 파일 수정
- 유틸리티 함수 수정
- 라우트 수정

**Hot Reload가 작동하지 않는 경우 (서버 재시작 필요):**
- package.json 의존성 변경
- Dockerfile 수정
- 환경변수 변경
- 데이터베이스 스키마 변경

## 🔧 접속 정보

| 서비스 | URL | 포트 |
|--------|-----|------|
| Backend API | http://localhost:3350 | 3350 |
| API 문서 | http://localhost:3350/api-docs | 3350 |
| Health Check | http://localhost:3350/health | 3350 |
| PostgreSQL | localhost:3236 | 3236 |

## 📁 프로젝트 구조

```text
api-ai645-node/
├── docker-compose.yml
├── docker-compose.prod.yml
├── scripts/dev.sh
└── backend/
    ├── src/
    │   ├── entities/
    │   ├── usecases/
    │   ├── controllers/
    │   ├── routes/
    │   ├── services/
    │   ├── prompts/
    │   ├── repositories/
    │   ├── config/
    │   ├── utils/
    │   └── index.ts
    ├── prisma/
    ├── Dockerfile
    ├── Dockerfile.prod
    └── package.json
```

## 🎯 API 사용 예제

상세 운세 API 예시는 `/api-docs` Swagger 문서를 기준으로 확인합니다.

### 관리자 API (관리자 권한 필요)
```bash
# 전체 사용자 목록 조회
curl -X GET http://localhost:3350/api/admin/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 사용자 역할 변경
curl -X PUT http://localhost:3350/api/admin/users/USER_ID/role \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "ADMIN"}'

# API 사용 통계 조회
curl -X GET "http://localhost:3350/api/admin/stats/api?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 시스템 상태 조회
curl -X GET http://localhost:3350/api/admin/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 공지/지원 API
```bash
# 공지사항 목록 조회
curl -X GET http://localhost:3350/api/board/NOTICE

# FAQ 목록 조회
curl -X GET http://localhost:3350/api/v1/support/faqs

# 게시글 조회 (단일)
curl -X GET http://localhost:3350/api/board/post/POST_ID

# 공지사항 수정 (관리자)
curl -X PUT http://localhost:3350/api/board/post/POST_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "수정된 제목",
    "content": "수정된 내용"
  }'

# 공지사항 삭제 (관리자)
curl -X DELETE http://localhost:3350/api/board/post/POST_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## 🗄️ 데이터베이스 구조

### 주요 테이블
- `user`: 회원 정보 (이메일/소셜 가입 구분, provider, providerId 등)
- `api_usage`: API 사용량 통계
- `ip_limit_records`: IP별 요청 제한 기록

### 회원(User) 테이블 구조
| 필드명        | 타입      | 설명                         |
|--------------|----------|------------------------------|
| id           | String   | PK, 고유 식별자              |
| nickname     | String   | 닉네임                       |
| role         | UserRole | 사용자 역할(USER/ADMIN)      |
| createdAt    | DateTime | 생성일                       |
| deletedAt    | DateTime?| 삭제일(소프트 삭제)          |

### 사용자 역할(UserRole)
| 역할         | 설명                         |
|--------------|------------------------------|
| USER         | 일반 사용자 (기본값)         |
| ADMIN        | 관리자 (전체 권한)           |

### 게시판 카테고리(BoardCategory)
| 카테고리     | 설명                         | 읽기 권한 | 작성 권한 | 수정/삭제 권한 |
|--------------|------------------------------|-----------|-----------|----------------|
| NOTICE       | 공지사항                     | 누구나    | 관리자    | 관리자         |

### 🔒 보안 특징
- 공지사항은 모든 사용자가 자유롭게 조회 가능
- 공지 작성/수정/삭제는 관리자만 가능
- 문의/제휴는 프론트에서 카카오 채널로 유도

### 5. BoardPost (게시글)
| 필드명        | 타입          | 설명                         |
|--------------|---------------|------------------------------|
| id           | String        | PK, 고유 식별자              |
| category     | BoardCategory | 게시판 카테고리              |
| title        | String        | 제목 (최대 200자)            |
| content      | String        | 내용 (최대 10000자)          |
| authorName   | String        | 작성자 이름 (최대 40자, 모든 카테고리에서 필수) |
| authorId     | String?       | 작성자 ID (제휴문의는 익명)  |
| isImportant  | Boolean       | 중요공지 여부                |
| viewCount    | Int           | 조회수                       |
| createdAt    | DateTime      | 생성일                       |
| updatedAt    | DateTime      | 수정일                       |
| deletedAt    | DateTime?     | 삭제일 (소프트 삭제)         |

 

### 데이터베이스 관리
```bash
# Prisma 마이그레이션
docker compose exec backend npx prisma migrate dev

# 데이터베이스 직접 접속
docker compose exec db psql -U postgres -d main
```

## 🗄️ Prisma Studio - 데이터베이스 관리 UI

Prisma Studio는 데이터베이스를 시각적으로 관리할 수 있는 웹 인터페이스입니다.

### 🚀 Prisma Studio 실행 방법

#### 1. Docker 환경에서 실행 (권장)
```bash
# 백엔드 컨테이너에서 Prisma Studio 실행
docker compose exec backend npx prisma studio --port 5556 --hostname 0.0.0.0

# 또는 백그라운드에서 실행
docker compose exec -d backend npx prisma studio --port 5556 --hostname 0.0.0.0
```

#### 2. 로컬 환경에서 실행
```bash
cd backend

# 환경변수 설정 후 실행
DATABASE_URL="postgres://postgres:postgres@localhost:3236/main" npx prisma studio --port 5556
```

### 🌐 접속 정보
- **URL**: http://localhost:5556
- **포트**: 5556
- **데이터베이스**: PostgreSQL (main)

### 📊 Prisma Studio 주요 기능

#### 🔍 데이터 조회 및 검색
- 모든 테이블의 데이터를 테이블 형태로 조회
- 필터링 및 정렬 기능
- 검색 기능으로 특정 데이터 빠르게 찾기

#### ✏️ 데이터 편집
- **추가**: 새로운 레코드 생성
- **수정**: 기존 데이터 직접 편집
- **삭제**: 불필요한 데이터 제거
- **복사**: 데이터 복사 및 붙여넣기

#### 📈 테이블 구조 확인
- 각 테이블의 스키마 정보 확인
- 필드 타입 및 제약조건 확인
- 관계(Relation) 정보 확인

#### 🔄 실시간 업데이트
- 데이터 변경 시 실시간 반영
- 다른 사용자의 변경사항 즉시 확인

### 🎯 주요 테이블 관리

#### 👥 User (사용자)
- 소셜 로그인 사용자 정보 관리
- 이메일, 닉네임, 가입 방식 확인
- 사용자별 구독 상태 확인

#### 📊 RecommendationHistory (추천 내역)
- 사용자별 추천 번호 이력 조회
- 추천 조건 및 결과 분석
- 성공/실패 패턴 분석

#### 🏆 WinningNumbers (당첨번호)
- 회차별 당첨번호 데이터 확인
- 당첨금액 및 추첨일 정보
- 보너스 번호 정보

#### 💳 Payment & Subscription (결제/구독)
- 사용자별 결제 내역 확인
- 구독 상태 및 만료일 관리
- 결제 방법 및 금액 정보

### ⚠️ 주의사항

#### 🔒 보안
- Prisma Studio는 개발 환경에서만 사용
- 프로덕션 환경에서는 절대 실행하지 않음
- 데이터 삭제 시 신중하게 처리

#### 🚫 제한사항
- 대용량 데이터 조회 시 성능 저하 가능
- 복잡한 쿼리는 SQL 클라이언트 사용 권장
- 동시 접속자 수 제한

#### 🛠️ 문제 해결
```bash
# 포트 충돌 시 다른 포트 사용
npx prisma studio --port 5557

# 호스트 바인딩 문제 시
npx prisma studio --port 5556 --hostname 0.0.0.0

# 데이터베이스 연결 문제 시
docker compose restart db
docker compose exec backend npx prisma studio
```

### 📱 모바일 접속
Prisma Studio는 반응형 웹 인터페이스로 모바일에서도 사용 가능합니다.
- 브라우저에서 http://localhost:5556 접속
- 터치 인터페이스로 데이터 편집 가능

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

# 실시간 로그 확인 (GPT 응답 포함)
docker compose logs -f backend | grep -E "(GPT|🔍|🤖|📊|🖼️|📝|✅)"

# 에러 로그만 확인
docker compose logs -f backend | grep -i error

# API 요청 로그만 확인
docker compose logs -f backend | grep -E "(POST|GET|PUT|DELETE)"

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
docker compose exec backend npx prisma studio --port 5556 --hostname 0.0.0.0
```

#### 🧹 정리
```bash
# 사용하지 않는 컨테이너/이미지 정리
docker system prune

# 모든 컨테이너, 이미지, 볼륨 삭제 (주의!)
docker system prune -a --volumes
```

## 🔐 사용자 권한 관리

### 역할 기반 접근 제어 (RBAC)
- **USER**: 일반 사용자 (기본값)
  - 운세 결과 조회 및 채팅 이용
  - 개인 구매내역 및 계정 설정 관리
  - 결제 및 상담 이용권 관리
- **ADMIN**: 관리자
  - 모든 USER 권한
  - 전체 사용자 목록 조회
  - 사용자 역할 변경
  - API 사용 통계 조회
  - 시스템 상태 모니터링

### 관리자 생성 방법
```bash
# 1. 스크립트로 관리자 생성
docker compose exec backend node scripts/create-admin.js

# 2. Prisma Studio에서 기존 사용자를 관리자로 변경
# http://localhost:5556 → users 테이블 → role 필드를 ADMIN으로 변경

# 3. 소셜 로그인 후 관리자 권한 부여
# - 소셜 로그인으로 계정 생성
# - Prisma Studio에서 해당 사용자의 role을 ADMIN으로 변경
```

### 권한 체크 미들웨어
```typescript
// 관리자 권한 체크
import { requireAdmin } from '../middlewares/auth';
router.use('/admin', requireAdmin);

// 특정 역할 권한 체크
import { requireRole } from '../middlewares/auth';
router.use('/premium', requireRole('ADMIN'));
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
cp backend/.env backend/.env.production

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
