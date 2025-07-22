# 배포 및 데이터 관리 가이드

## 🚀 자동 데이터 초기화 설정

이 프로젝트는 Docker Compose를 사용하여 자동으로 데이터를 초기화하고 관리합니다.

### 📁 설정된 파일들

1. **`database/init/01-init-db.sql`** - PostgreSQL 초기화 스크립트
2. **`backend/scripts/init-data.sh`** - 데이터 자동 import 스크립트
3. **`docker-compose.yml`** - 프로덕션용 설정
4. **`docker-compose.dev.yml`** - 개발용 설정

### 🔄 자동 데이터 초기화 과정

1. **PostgreSQL 컨테이너 시작**
   - `database/init/` 폴더의 SQL 스크립트들이 자동 실행
   - 데이터베이스 및 스키마 초기화

2. **백엔드 컨테이너 시작**
   - `init-data.sh` 스크립트가 자동 실행
   - 데이터베이스 연결 확인
   - Prisma 마이그레이션 실행
   - 당첨번호 데이터 확인 및 import (필요시)
   - Prisma 클라이언트 생성

### 📊 데이터 보존

- **Docker 볼륨**: `postgres_data` 볼륨으로 데이터 영구 보존
- **CSV 백업**: `backend/data/winning_numbers.csv` 파일로 데이터 백업
- **자동 복구**: 데이터가 없으면 자동으로 CSV에서 import

## 🛠️ 배포 방법

### 개발 환경
```bash
# 개발용 Docker Compose 실행
docker-compose -f docker-compose.dev.yml up -d

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f backend
```

### 프로덕션 환경
```bash
# 프로덕션용 Docker Compose 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f backend
```

## 🔧 수동 데이터 관리

### 데이터 확인
```bash
# 데이터베이스 연결
docker exec -it api-database psql -U postgres -d main

# 당첨번호 데이터 확인
SELECT COUNT(*) FROM winning_numbers;
SELECT * FROM winning_numbers ORDER BY round DESC LIMIT 5;
```

### 수동 데이터 import
```bash
# 백엔드 컨테이너에서 실행
docker exec -it api-backend npx ts-node src/scripts/importWinningNumbers.ts
```

### 볼륨 관리
```bash
# 볼륨 목록 확인
docker volume ls

# 볼륨 삭제 (주의: 데이터 손실)
docker volume rm api-ai645-node_postgres_data

# 볼륨 백업
docker run --rm -v api-ai645-node_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

## 🚨 문제 해결

### 데이터가 사라진 경우
1. **볼륨 확인**: `docker volume ls`
2. **컨테이너 재시작**: `docker-compose restart`
3. **수동 import**: `docker exec -it api-backend npx ts-node src/scripts/importWinningNumbers.ts`

### 마이그레이션 오류
1. **마이그레이션 재실행**: `docker exec -it api-backend npx prisma migrate deploy`
2. **스키마 리셋**: `docker exec -it api-backend npx prisma migrate reset`

### 컨테이너 로그 확인
```bash
# 백엔드 로그
docker-compose logs -f backend

# 데이터베이스 로그
docker-compose logs -f db
```

## 📈 모니터링

### 헬스체크
- **데이터베이스**: `pg_isready` 명령어로 연결 상태 확인
- **백엔드**: `/api/health` 엔드포인트로 서비스 상태 확인

### 로그 모니터링
```bash
# 실시간 로그 확인
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f db
```

## 🔒 보안 고려사항

1. **환경변수**: 민감한 정보는 `.env` 파일에 저장
2. **볼륨 권한**: 데이터베이스 볼륨에 적절한 권한 설정
3. **네트워크**: Docker 네트워크로 서비스 격리
4. **비특권 사용자**: 컨테이너 내에서 비특권 사용자로 실행

## 📝 주의사항

- **데이터 백업**: 정기적으로 볼륨 백업 수행
- **볼륨 삭제**: `docker volume rm` 명령어 사용 시 데이터 손실 주의
- **마이그레이션**: 프로덕션에서 스키마 변경 시 주의
- **리소스 모니터링**: 메모리 및 디스크 사용량 모니터링 