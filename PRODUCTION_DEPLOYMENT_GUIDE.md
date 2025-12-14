# 프로덕션 배포 가이드

## 📋 개요

이 문서는 프로덕션 환경 배포, 마이그레이션, 관리자 계정 생성에 대한 종합 가이드입니다.

## 🚀 배포 프로세스

### 자동 배포 (권장)

1. **코드 커밋 및 푸시**
   ```bash
   git add .
   git commit -m "변경사항"
   git push origin main
   ```

2. **CloudType에서 자동 배포**
   - GitHub에 푸시하면 자동으로 배포 시작
   - 배포 로그에서 진행 상황 확인

### 배포 로그 확인

배포 후 다음 메시지들을 확인하세요:

```
✅ DATABASE_URL 설정됨
✅ 데이터베이스 연결 성공
✅ 마이그레이션 락 획득 성공
✅ 데이터베이스 스키마 동기화 성공
✅ users.phone 컬럼이 존재합니다
✅ 시드 데이터 실행 성공
✅ 관리자 계정이 존재합니다 (44tune@44tune.co.kr)
```

## 🔧 수동 마이그레이션 (긴급 시)

### Node 서버 터미널에서 실행

1. **CloudType 대시보드 접속**
   - 프로젝트: `api-ai645-node`
   - **api-ai645-node** 카드 클릭
   - 터미널 아이콘 클릭

2. **마이그레이션 실행**
   ```bash
   # DATABASE_URL 확인
   echo $DATABASE_URL
   
   # 마이그레이션 실행 (generate 자동 포함)
   npx prisma db push --accept-data-loss=false
   ```

3. **관리자 계정 생성**
   ```bash
   # 시드 실행
   npx prisma db seed
   
   # 또는 직접 스크립트 실행
   node scripts/create-temp-account.js
   ```

## 👤 관리자 계정

### 기본 계정 정보

- **이메일**: `44tune@44tune.co.kr`
- **비밀번호**: `ai645!`
- **닉네임**: `포포춘관리자`

### 계정 확인

```bash
# API로 로그인 테스트
curl -X POST https://api.44tune.co.kr/api/auth/temp-login \
  -H "Content-Type: application/json" \
  -d '{"email":"44tune@44tune.co.kr","password":"ai645!"}'
```

### 계정이 없는 경우

```bash
# CloudType 터미널에서 실행
node scripts/create-temp-account.js
```

## 🔍 문제 해결

### 마이그레이션 실패

1. **권한 오류**
   - PostgreSQL 사용자에게 DDL 권한 부여 필요
   - CloudType 대시보드에서 DATABASE_URL 확인

2. **연결 실패**
   - PostgreSQL 서비스 상태 확인
   - 네트워크 연결 확인

3. **락 획득 실패**
   - 다른 마이그레이션이 실행 중일 수 있음
   - 완료될 때까지 대기

### 관리자 계정 생성 실패

1. **시드 실행 확인**
   ```bash
   npx prisma db seed
   ```

2. **수동 계정 생성**
   ```bash
   node scripts/create-temp-account.js
   ```

3. **로그 확인**
   - 배포 로그에서 시드 실행 결과 확인
   - 오류 메시지 확인

## 📚 관련 파일

- `backend/scripts/migrate-seed-and-start.sh` - 배포 시작 스크립트
- `backend/prisma/seed.js` - 시드 스크립트 (관리자 계정 생성)
- `backend/scripts/create-temp-account.js` - 수동 계정 생성 스크립트
- `backend/Dockerfile.prod` - 프로덕션 Dockerfile

## ⚠️ 주의사항

1. **데이터 보존**: `--accept-data-loss=false` 옵션으로 데이터 안전성 보장
2. **동시 실행 방지**: Advisory Lock으로 동시 마이그레이션 방지
3. **권한**: PostgreSQL 사용자에게 DDL 권한 필요
4. **백업**: 중요한 변경 전 데이터베이스 백업 권장

