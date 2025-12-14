# 마이그레이션 스크립트 개선 사항

## 🔍 분석 기반 개선 내용

사용자 제공 심층 분석을 바탕으로 `migrate-seed-and-start.sh` 스크립트를 전면 개선했습니다.

## ✅ 개선된 항목

### 1. 실행 주체 레이어 ✅

**문제**: 마이그레이션이 실행되는지 확인 불가
**해결**:
- 각 단계마다 명확한 로그 출력
- 타임스탬프 추가
- 단계별 성공/실패 명시

### 2. 타이밍 레이어 ✅

**문제**: DB가 준비되기 전에 마이그레이션 시도
**해결**:
- **DB 연결 대기 로직 추가** (최대 30회, 2초 간격)
- 재시도 로직으로 DB ready 상태 확인
- 연결 실패 시 명확한 오류 메시지

```bash
# 최대 30회 재시도 (60초)
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if npx prisma db execute --stdin <<< "SELECT 1"; then
        break
    fi
    sleep 2
done
```

### 3. 권한 레이어 ✅

**문제**: 상용 DB 유저가 DDL 권한이 없을 수 있음
**해결**:
- **DDL 권한 확인 로직 추가**
- 권한 부족 시 경고 메시지
- 상세한 오류 분석 및 해결 방법 제시

```bash
# DDL 권한 확인
PERMISSION_CHECK=$(npx prisma db execute --stdin <<< 
    "SELECT has_database_privilege(current_user, current_database(), 'CREATE')")
```

### 4. 연결 레이어 ✅

**문제**: DATABASE_URL이 다른 DB를 가리킬 수 있음
**해결**:
- **DATABASE_URL 검증 강화**
- 호스트 및 데이터베이스명 추출 및 표시
- 연결 전 검증

```bash
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
echo "호스트: $DB_HOST"
echo "데이터베이스: $DB_NAME"
```

### 5. 상태 레이어 ✅

**문제**: 마이그레이션 히스토리 테이블 불일치
**해결**:
- 마이그레이션 후 변경사항 확인
- `users.phone` 컬럼 존재 여부 자동 확인
- 성공/실패 명확히 표시

```bash
# 변경사항 확인
PHONE_EXISTS=$(npx prisma db execute --stdin <<< 
    "SELECT column_name FROM information_schema.columns 
     WHERE table_name = 'users' AND column_name = 'phone';")
```

### 6. 멀티 인스턴스 레이어 ✅

**문제**: 여러 컨테이너가 동시에 마이그레이션 실행
**해결**:
- **PostgreSQL Advisory Lock 사용**
- 동시 실행 방지
- 락 획득 실패 시 명확한 메시지

```bash
# Advisory lock으로 동시 실행 방지
LOCK_ID=1234567890
LOCK_ACQUIRED=$(npx prisma db execute --stdin <<< 
    "SELECT pg_try_advisory_lock($LOCK_ID)")
```

### 7. 권한 문제 우회 ✅

**문제**: `prisma generate` 권한 오류
**해결**:
- `prisma db push`가 자동으로 `generate` 실행
- `generate` 실패해도 계속 진행
- `--skip-generate=false` 명시

### 8. 에러 처리 강화 ✅

**문제**: 오류 발생 시 원인 파악 어려움
**해결**:
- `set -euo pipefail` 엄격한 에러 처리
- 상세한 오류 분석
- 해결 방법 제시
- 오류 키워드 자동 감지

```bash
echo "$MIGRATION_OUTPUT" | grep -i "error\|permission\|denied\|timeout\|connection"
```

## 📋 개선 전후 비교

### 개선 전
- ❌ DB ready 체크 없음
- ❌ 재시도 로직 없음
- ❌ 권한 확인 없음
- ❌ DATABASE_URL 검증 부족
- ❌ 동시 실행 방지 없음
- ❌ 에러 분석 부족

### 개선 후
- ✅ DB ready 체크 (최대 30회 재시도)
- ✅ 재시도 로직 포함
- ✅ DDL 권한 확인
- ✅ DATABASE_URL 검증 및 표시
- ✅ Advisory Lock으로 동시 실행 방지
- ✅ 상세한 에러 분석 및 해결 방법

## 🚀 사용 방법

스크립트는 자동으로 실행되지만, 수동 실행도 가능:

```bash
# CloudType 터미널에서
./scripts/migrate-seed-and-start.sh
```

## 🔒 안전성 보장

1. **데이터 보존**: `--accept-data-loss=false` 옵션
2. **동시 실행 방지**: Advisory Lock
3. **재시도 로직**: DB ready 상태 확인
4. **권한 확인**: DDL 권한 사전 확인
5. **에러 처리**: 엄격한 에러 처리 및 롤백

## 📊 모니터링

각 단계마다 명확한 로그가 출력되므로:
- CloudType 배포 로그에서 진행 상황 확인 가능
- 실패 지점 즉시 파악 가능
- 디버깅 시간 단축

## ⚠️ 주의사항

1. **Advisory Lock**: 락 ID는 고정값 사용 (다른 프로세스와 공유)
2. **타임아웃**: DB 연결 대기는 최대 60초
3. **권한**: PostgreSQL 사용자에게 DDL 권한 필요

## 🔄 향후 개선 가능 사항

1. 마이그레이션 관측성 대시보드
2. Shadow DB 검증
3. 백필 작업 큐 시스템
4. 스키마 드리프트 감지

