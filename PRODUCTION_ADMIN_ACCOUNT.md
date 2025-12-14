# 프로덕션 관리자 계정 생성 가이드

## 📋 개요

프로덕션 환경에서 관리자 계정 생성 방법을 안내합니다.

## 🔍 현재 설정 상태

### 자동 계정 생성 ✅

프로덕션 배포 시 **자동으로 관리자 계정이 생성**됩니다:

1. **배포 프로세스**:
   - `Dockerfile.prod`에서 `migrate-seed-and-start.sh` 스크립트 실행
   - 이 스크립트는 `npx prisma db seed` 명령을 실행
   - `prisma/seed.js` 파일이 실행되어 관리자 계정 생성
   - **시드 실행 후 자동으로 계정 존재 여부 확인**

2. **기본 계정 정보**:
   - 이메일: `44tune@44tune.co.kr`
   - 비밀번호: `ai645!`
   - 닉네임: `포포춘관리자`

3. **중복 방지**:
   - 이미 계정이 존재하면 새로 생성하지 않음
   - 기존 계정이 있으면 "이미 존재합니다" 메시지 출력

4. **자동 확인**:
   - 배포 로그에서 "✅ 관리자 계정이 존재합니다" 메시지 확인 가능
   - 계정이 없으면 경고 메시지와 수동 생성 방법 안내

## ⚠️ 계정이 생성되지 않는 경우

### 1. 배포 로그 확인

CloudType 대시보드에서 배포 로그를 확인하세요:

```bash
# 로그에서 다음 메시지 확인:
# ✅ 시드 데이터 실행 성공
# 또는
# ⚠️ 시드 데이터 실행 실패 (계속 진행)
```

### 2. 수동 계정 생성 방법

#### 방법 1: CloudType 터미널에서 실행

1. CloudType 대시보드 접속
2. 프로젝트 선택: `api-ai645-node`
3. **Terminal** 탭 클릭
4. 다음 명령 실행:

```bash
# 시드만 실행
npx prisma db seed

# 또는 직접 스크립트 실행
node prisma/seed.js
```

#### 방법 2: create-temp-account 스크립트 사용

```bash
# CloudType 터미널에서 실행
node scripts/create-temp-account.js
```

#### 방법 3: 환경변수로 커스텀 계정 생성

```bash
# CloudType 터미널에서 실행
TEMP_EMAIL="admin@44tune.co.kr" \
TEMP_PASSWORD="your-password" \
TEMP_NICKNAME="관리자" \
node scripts/create-temp-account.js custom
```

## 🔧 문제 해결

### 시드가 실행되지 않는 경우

1. **DATABASE_URL 확인**:
   ```bash
   echo $DATABASE_URL
   ```

2. **Prisma 클라이언트 생성**:
   ```bash
   npx prisma generate
   ```

3. **데이터베이스 연결 확인**:
   ```bash
   npx prisma db push
   ```

4. **시드 수동 실행**:
   ```bash
   npx prisma db seed
   ```

### 계정이 이미 존재하는 경우

기존 계정을 사용하거나, 다른 이메일로 계정을 생성하세요:

```bash
TEMP_EMAIL="new-admin@44tune.co.kr" \
TEMP_PASSWORD="new-password" \
node scripts/create-temp-account.js custom
```

## 📝 계정 정보 확인

### API로 로그인 테스트

```bash
curl -X POST https://api.44tune.co.kr/api/auth/temp-login \
  -H "Content-Type: application/json" \
  -d '{"email":"44tune@44tune.co.kr","password":"ai645!"}'
```

### 데이터베이스에서 직접 확인

```sql
SELECT id, email, nickname, "createdAt" 
FROM users 
WHERE email = '44tune@44tune.co.kr';
```

## 🚀 권장 사항

1. **초기 배포 후 확인**:
   - 배포 로그에서 "✅ 시드 데이터 실행 성공" 메시지 확인
   - API로 로그인 테스트 수행

2. **보안 강화**:
   - 프로덕션에서는 기본 비밀번호 변경 권장
   - 환경변수로 비밀번호 관리

3. **모니터링**:
   - 정기적으로 관리자 계정 존재 여부 확인
   - 로그인 실패 시 알림 설정

## 📚 관련 파일

- `backend/prisma/seed.js` - 시드 스크립트
- `backend/scripts/migrate-seed-and-start.sh` - 배포 시작 스크립트
- `backend/scripts/create-temp-account.js` - 수동 계정 생성 스크립트
- `backend/Dockerfile.prod` - 프로덕션 Dockerfile

