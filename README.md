# API AI645 Node.js Backend

Node.js(Express) 백엔드와 PostgreSQL 데이터베이스를 사용하는 웹서비스입니다.

## 🚀 시작하기

### 전제 조건
- Docker
- Docker Compose

### 환경 설정

1. **환경변수 파일 생성**
   ```bash
   # 루트 디렉토리에서
   cp env.example .env
   
   # backend 디렉토리에서
   cd backend
   cp env.example .env
   ```

2. **환경변수 수정**
   ```bash
   # backend/.env 파일을 열어서 필요한 값들을 설정하세요
   ```

### 개발 환경 실행

```bash
# 전체 서비스 실행
docker compose up

# 백그라운드에서 실행
docker compose up -d

# 특정 서비스만 실행
docker compose up backend
docker compose up db
```

### Production 환경 실행

```bash
# Production 환경 설정
docker compose -f docker-compose.prod.yml up -d
```

## 📁 프로젝트 구조

```
.
├── docker-compose.yml          # 개발 환경 Docker Compose
├── docker-compose.prod.yml     # Production 환경 Docker Compose
├── .dockerignore              # Docker 빌드 제외 파일
├── env.example               # 환경변수 예시 파일
├── README.md
└── backend/
    ├── Dockerfile            # 개발용 Dockerfile
    ├── Dockerfile.prod       # Production용 Dockerfile
    ├── env.example          # Backend 환경변수 예시
    ├── package.json
    └── src/
        └── ... (애플리케이션 코드)
```

## 🔧 주요 설정

### 포트 설정
- **Backend**: 외부 3350 → 내부 4000
- **PostgreSQL**: 외부 3236 → 내부 5432

### 데이터베이스 연결
```javascript
DATABASE_URL=postgres://postgres:postgres@db:5432/main
```

### 환경변수
| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL 연결 URL | postgres://postgres:postgres@db:5432/main |
| `NODE_ENV` | 실행 환경 | development |
| `PORT` | 서버 포트 | 4000 |
| `JWT_SECRET` | JWT 비밀키 | - |

## 🛠️ 유용한 명령어

### Docker 명령어
```bash
# 컨테이너 상태 확인
docker compose ps

# 로그 확인
docker compose logs backend
docker compose logs db

# 컨테이너 재시작
docker compose restart backend

# 컨테이너 내부 접속
docker compose exec backend sh
docker compose exec db psql -U postgres -d main

# 모든 컨테이너 중지 및 제거
docker compose down

# 볼륨과 함께 모든 것 제거
docker compose down -v
```

### 데이터베이스 관리
```bash
# PostgreSQL 컨테이너에 접속
docker compose exec db psql -U postgres -d main

# 데이터베이스 백업
docker compose exec db pg_dump -U postgres main > backup.sql

# 데이터베이스 복원
docker compose exec -T db psql -U postgres main < backup.sql
```

## 🔒 보안 고려사항

### Development 환경
- 기본 PostgreSQL 계정 사용 (postgres/postgres)
- 볼륨 마운트로 실시간 코드 변경 반영

### Production 환경
- 강력한 PostgreSQL 비밀번호 사용
- 비특권 사용자로 컨테이너 실행
- Health check 설정
- 리소스 제한 설정
- dumb-init으로 시그널 처리 최적화

## 📈 모니터링

### Health Check
- Backend: `http://localhost:3350/health`
- Database: PostgreSQL의 `pg_isready` 명령어 사용

### 로그 모니터링
```bash
# 실시간 로그 확인
docker compose logs -f backend

# 특정 시간대 로그 확인
docker compose logs --since="2024-01-01T00:00:00" backend
```

## 🚀 배포

1. **Production 환경변수 설정**
   ```bash
   cp backend/env.example backend/.env.production
   # .env.production 파일에서 production 값들 설정
   ```

2. **Production 배포**
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

3. **배포 확인**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   curl http://localhost:3350/health
   ```

## 🆘 문제 해결

### 일반적인 문제들

1. **포트 충돌**
   ```bash
   # 포트 사용 중인 프로세스 확인
   lsof -i :3350
   lsof -i :3236
   ```

2. **데이터베이스 연결 실패**
   ```bash
   # DB 컨테이너 상태 확인
   docker compose logs db
   
   # 네트워크 연결 확인
   docker compose exec backend ping db
   ```

3. **컨테이너 재시작 루프**
   ```bash
   # 상세 로그 확인
   docker compose logs --tail=50 backend
   ```

## 📞 지원

문제가 발생하면 다음을 확인해주세요:
1. Docker와 Docker Compose 버전
2. 포트 충돌 여부
3. 환경변수 설정
4. 컨테이너 로그 