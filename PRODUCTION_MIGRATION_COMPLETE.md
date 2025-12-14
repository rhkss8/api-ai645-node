# 프로덕션 마이그레이션 완전 개선 가이드

## 🎯 개선 완료 사항

사용자 제공 심층 분석을 바탕으로 `migrate-seed-and-start.sh` 스크립트를 전면 개선했습니다.

## ✅ 해결된 문제들

### 1. 실행 주체 레이어 ✅
- **문제**: 마이그레이션이 실행되는지 확인 불가
- **해결**: 각 단계마다 명확한 로그 출력, 타임스탬프 추가

### 2. 타이밍 레이어 ✅
- **문제**: DB가 준비되기 전에 마이그레이션 시도
- **해결**: **DB 연결 대기 로직 추가** (최대 30회, 2초 간격, 총 60초)

### 3. 권한 레이어 ✅
- **문제**: 상용 DB 유저가 DDL 권한이 없을 수 있음
- **해결**: 데이터베이스 접근 권한 확인, 상세한 오류 분석

### 4. 연결 레이어 ✅
- **문제**: DATABASE_URL이 다른 DB를 가리킬 수 있음
- **해결**: **DATABASE_URL 검증 강화**, 호스트/DB명 추출 및 표시

### 5. 상태 레이어 ✅
- **문제**: 마이그레이션 히스토리 테이블 불일치
- **해결**: 마이그레이션 후 변경사항 자동 확인 (`users.phone` 컬럼 존재 여부)

### 6. 멀티 인스턴스 레이어 ✅
- **문제**: 여러 컨테이너가 동시에 마이그레이션 실행
- **해결**: **PostgreSQL Advisory Lock 사용**으로 동시 실행 방지

### 7. 권한 문제 우회 ✅
- **문제**: `prisma generate` 권한 오류
- **해결**: `prisma db push`가 자동으로 `generate` 실행, 실패해도 계속 진행

### 8. 에러 처리 강화 ✅
- **문제**: 오류 발생 시 원인 파악 어려움
- **해결**: 엄격한 에러 처리, 상세한 오류 분석, 해결 방법 제시

## 📋 주요 개선 내용

### DB 연결 대기 (재시도 로직)

```bash
MAX_RETRIES=30
RETRY_INTERVAL=2

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if npx prisma db execute --stdin <<< "SELECT 1"; then
        break
    fi
    sleep 2
done
```

### 동시 실행 방지 (Advisory Lock)

```bash
LOCK_ID=1234567890
LOCK_RESULT=$(npx prisma db execute --stdin <<< 
    "SELECT pg_try_advisory_lock($LOCK_ID)")

if [ 락 획득 성공 ]; then
    # 마이그레이션 실행
    # 종료 시 락 해제
fi
```

### DATABASE_URL 검증

```bash
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
echo "호스트: $DB_HOST"
echo "데이터베이스: $DB_NAME"
```

### 변경사항 자동 확인

```bash
PHONE_EXISTS=$(npx prisma db execute --stdin <<< 
    "SELECT column_name FROM information_schema.columns 
     WHERE table_name = 'users' AND column_name = 'phone';")

if [ "$PHONE_EXISTS" -gt 0 ]; then
    echo "✅ users.phone 컬럼이 존재합니다"
fi
```

## 🚀 배포 방법

### 자동 배포 (권장)

1. **코드 커밋 및 푸시**
   ```bash
   git add backend/scripts/migrate-seed-and-start.sh
   git commit -m "프로덕션 마이그레이션 스크립트 개선"
   git push origin main
   ```

2. **CloudType에서 재배포**
   - 대시보드에서 "Deploy" 또는 "Restart" 클릭
   - 배포 로그에서 다음 메시지 확인:
     ```
     ✅ 데이터베이스 연결 성공
     ✅ 마이그레이션 락 획득 성공
     ✅ 데이터베이스 스키마 동기화 성공
     ✅ users.phone 컬럼이 존재합니다
     ```

### 수동 실행 (긴급 시)

CloudType 터미널에서:

```bash
# Node 서버 터미널 접속
./scripts/migrate-seed-and-start.sh
```

## 📊 로그 확인

배포 후 CloudType 로그에서 다음을 확인:

1. **환경변수 확인**
   ```
   ✅ DATABASE_URL 설정됨
      호스트: svc.sel5.cloudtype.app
      데이터베이스: main
   ```

2. **DB 연결 대기**
   ```
   ✅ 데이터베이스 연결 성공! (시도: 1/30)
   ```

3. **마이그레이션 실행**
   ```
   ✅ 마이그레이션 락 획득 성공
   ✅ 데이터베이스 스키마 동기화 성공
   ✅ users.phone 컬럼이 존재합니다
   ```

## ⚠️ 문제 해결

### 마이그레이션이 실패하는 경우

1. **권한 오류**
   ```
   ❌ 데이터베이스 스키마 동기화 실패
   ⚠️ 가능한 원인: 데이터베이스 권한 부족 (ALTER TABLE 권한 필요)
   ```
   - 해결: PostgreSQL 사용자에게 DDL 권한 부여

2. **연결 실패**
   ```
   ❌ 데이터베이스 연결 실패 (최대 재시도 횟수 초과)
   ```
   - 해결: PostgreSQL 서비스 상태 확인, DATABASE_URL 확인

3. **락 획득 실패**
   ```
   ⚠️ 마이그레이션 락 획득 실패 (다른 인스턴스가 실행 중일 수 있음)
   ```
   - 해결: 다른 마이그레이션이 완료될 때까지 대기

## 🔒 안전성 보장

1. **데이터 보존**: `--accept-data-loss=false` 옵션
2. **동시 실행 방지**: Advisory Lock
3. **재시도 로직**: DB ready 상태 확인
4. **에러 처리**: 엄격한 에러 처리 및 롤백
5. **변경사항 확인**: 자동 검증

## 📈 기대 효과

1. **안정성 향상**: DB ready 체크로 실패율 감소
2. **디버깅 시간 단축**: 상세한 로그로 원인 파악 용이
3. **동시 실행 방지**: Advisory Lock으로 경쟁 상태 방지
4. **자동 검증**: 변경사항 자동 확인으로 수동 작업 감소

## 🔄 다음 단계

1. **코드 커밋 및 배포**
2. **배포 로그 확인**
3. **소셜 로그인 테스트**
4. **문제 발생 시 로그 분석**

