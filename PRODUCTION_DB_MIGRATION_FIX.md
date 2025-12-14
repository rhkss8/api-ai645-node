# 프로덕션 데이터베이스 마이그레이션 수정 가이드

## 🚨 문제 상황

소셜 로그인 및 이메일 로그인 시 다음 오류 발생:

```
The column `users.phone` does not exist in the current database.
```

## 🔍 원인

Prisma 스키마에는 `users.phone` 필드가 정의되어 있지만, 실제 프로덕션 데이터베이스에는 이 컬럼이 존재하지 않습니다.

## ✅ 해결 방법

### 방법 1: CloudType 터미널에서 수동 마이그레이션 (권장)

1. **CloudType 대시보드 접속**
   - https://cloudtype.io 접속
   - 프로젝트 선택: `api-ai645-node`
   - **Terminal** 탭 클릭

2. **Prisma 클라이언트 재생성**
   ```bash
   npx prisma generate
   ```

3. **데이터베이스 스키마 동기화**
   ```bash
   npx prisma db push
   ```

4. **확인**
   ```bash
   # 스키마 확인
   npx prisma db execute --stdin <<< "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone';"
   ```

### 방법 2: 배포 재시작 (자동 마이그레이션)

배포 스크립트(`migrate-seed-and-start.sh`)가 자동으로 마이그레이션을 실행하도록 설정되어 있습니다.

1. **CloudType 대시보드에서 재배포**
   - 프로젝트 선택
   - **Deploy** 또는 **Restart** 클릭

2. **배포 로그 확인**
   - 다음 메시지가 나타나는지 확인:
   ```
   ✅ 데이터베이스 스키마 동기화 성공
   ```

### 방법 3: SQL 직접 실행 (고급)

데이터베이스에 직접 접속하여 컬럼 추가:

```sql
-- users 테이블에 phone 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- updatedAt 컬럼이 없는 경우 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
```

## 🔧 문제 해결 체크리스트

### 1. 데이터베이스 연결 확인

```bash
# CloudType 터미널에서 실행
echo $DATABASE_URL
```

### 2. Prisma 클라이언트 생성

```bash
npx prisma generate
```

### 3. 스키마 동기화

```bash
npx prisma db push
```

### 4. 확인

```bash
# users 테이블 구조 확인
npx prisma db execute --stdin <<< "\d users"
```

## 📋 추가 확인 사항

### users 테이블에 필요한 컬럼들

다음 컬럼들이 모두 존재하는지 확인:

- `id` (TEXT, PRIMARY KEY)
- `nickname` (VARCHAR(40))
- `email` (VARCHAR(255), UNIQUE, NULLABLE)
- `password` (VARCHAR(255), NULLABLE)
- **`phone` (VARCHAR(20), NULLABLE)** ← 이 컬럼이 누락됨
- `createdAt` (TIMESTAMP)
- **`updatedAt` (TIMESTAMP)** ← 이 컬럼도 확인 필요
- `deletedAt` (TIMESTAMP, NULLABLE)
- `role` (ENUM: USER, ADMIN)
- `termsAgreed` (BOOLEAN)
- `privacyAgreed` (BOOLEAN)
- `marketingAgreed` (BOOLEAN)

## 🚀 예방 조치

### 배포 전 확인

1. **로컬에서 스키마 확인**
   ```bash
   npx prisma db push --dry-run
   ```

2. **마이그레이션 스크립트 확인**
   - `backend/scripts/migrate-seed-and-start.sh` 파일 확인
   - `npx prisma db push` 명령이 포함되어 있는지 확인

3. **배포 로그 모니터링**
   - 배포 후 로그에서 "✅ 데이터베이스 스키마 동기화 성공" 메시지 확인

## 📚 관련 파일

- `backend/prisma/schema.prisma` - Prisma 스키마 정의
- `backend/scripts/migrate-seed-and-start.sh` - 배포 시작 스크립트
- `backend/Dockerfile.prod` - 프로덕션 Dockerfile

## ⚠️ 주의사항

1. **데이터 백업**: 마이그레이션 전 데이터베이스 백업 권장
2. **다운타임**: `prisma db push` 실행 시 짧은 다운타임 발생 가능
3. **롤백 계획**: 문제 발생 시 롤백 방법 준비

