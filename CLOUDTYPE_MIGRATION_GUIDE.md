# CloudType 마이그레이션 가이드 (서비스 분리 환경)

## 🏗️ CloudType 구조

CloudType에서는 다음과 같이 서비스가 분리되어 있습니다:

1. **api-ai645-node** (Node.js 서버)
   - Dockerfile로 빌드
   - 애플리케이션 코드 실행
   - `DATABASE_URL` 환경변수로 PostgreSQL 연결

2. **postgresql** (PostgreSQL 데이터베이스)
   - 별도 서비스로 실행
   - Node 서버에서 `DATABASE_URL`로 접속

## ✅ 마이그레이션 실행 방법

### 방법 1: Node 서버 터미널에서 실행 (권장) ⭐

**Node 서버 컨테이너에서 실행하면, `DATABASE_URL` 환경변수를 통해 PostgreSQL에 자동 연결됩니다.**

1. **CloudType 대시보드 접속**
   - https://cloudtype.io 접속
   - 프로젝트: `api-ai645-node`

2. **Node 서버 터미널 접속**
   - **api-ai645-node** 카드 클릭
   - 터미널 아이콘 (□ 안에 `>_`) 클릭
   - 또는 "접속하기" 버튼 → 터미널 선택

3. **다음 명령어 실행** (순서대로)

```bash
# 1. 현재 위치 확인 (보통 /app 또는 /app/backend)
pwd
ls -la

# 2. DATABASE_URL 확인 (중요!)
echo $DATABASE_URL
# 출력 예: postgresql://user:password@postgresql-host:port/database

# 3. Prisma 클라이언트 재생성
npx prisma generate

# 4. 데이터베이스 스키마 동기화
# ⚠️ 이 명령은 DATABASE_URL을 통해 PostgreSQL에 연결됩니다
npx prisma db push --accept-data-loss=false

# 5. 확인
npx prisma db execute --stdin <<< "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone';"
```

### 방법 2: PostgreSQL 직접 접속 (고급)

PostgreSQL 서비스에 직접 접속하여 확인할 수도 있습니다:

1. **PostgreSQL 카드 클릭**
2. **터미널 아이콘 클릭**
3. **psql 접속**

```bash
# PostgreSQL에 직접 접속
psql -U postgres -d main

# users 테이블 구조 확인
\d users

# phone 컬럼 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'phone';
```

## 🔍 작동 원리

### Node 서버에서 마이그레이션 실행 시:

```
Node 서버 컨테이너
    ↓ (DATABASE_URL 환경변수 사용)
    ↓
PostgreSQL 서비스
    ↓
데이터베이스 스키마 업데이트
```

**중요:**
- Node 서버 컨테이너에서 `npx prisma db push` 실행
- `DATABASE_URL` 환경변수가 자동으로 사용됨
- PostgreSQL 서비스에 직접 접속할 필요 없음

## ⚠️ 주의사항

1. **올바른 서비스 선택**
   - ✅ Node 서버 (`api-ai645-node`) 터미널에서 실행
   - ❌ PostgreSQL 터미널에서 실행하지 않음

2. **DATABASE_URL 확인**
   - CloudType 대시보드에서 환경변수 확인
   - 터미널에서 `echo $DATABASE_URL`로 확인

3. **데이터 안전성**
   - `prisma db push`는 기존 데이터를 삭제하지 않음
   - 새로운 컬럼만 추가됨
   - `--accept-data-loss=false` 옵션으로 안전성 보장

## 📋 체크리스트

- [ ] CloudType 대시보드 접속
- [ ] **api-ai645-node** 서비스 선택 (Node 서버)
- [ ] 터미널 접속
- [ ] `DATABASE_URL` 환경변수 확인
- [ ] `npx prisma generate` 실행
- [ ] `npx prisma db push` 실행
- [ ] 성공 메시지 확인
- [ ] `users.phone` 컬럼 존재 확인

## 🚀 빠른 실행 명령어

Node 서버 터미널에서 한 번에 실행:

```bash
npx prisma generate && \
npx prisma db push --accept-data-loss=false && \
npx prisma db execute --stdin <<< "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone';"
```

## ❓ 문제 해결

### DATABASE_URL이 없는 경우

```bash
# CloudType 대시보드에서 환경변수 확인
# Settings → Environment Variables → DATABASE_URL
```

### 연결 실패하는 경우

```bash
# PostgreSQL 서비스가 실행 중인지 확인
# CloudType 대시보드에서 postgresql 카드 확인
# "실행 중 (1/1)" 상태여야 함
```

### 권한 오류가 발생하는 경우

```bash
# DATABASE_URL의 사용자 권한 확인
# PostgreSQL 관리자 권한이 필요할 수 있음
```

