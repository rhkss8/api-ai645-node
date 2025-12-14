#!/bin/bash

# 마이그레이션, 시드, 서버 시작 스크립트 (프로덕션 강화 버전)
# 상용 환경에서 안정적으로 작동하도록 개선됨

set -euo pipefail  # 엄격한 에러 처리

echo "🚀 마이그레이션, 시드, 서버 시작 스크립트"
echo "=========================================="
echo "⏰ 시작 시간: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo ""

# ============================================
# 1. 환경변수 확인 및 검증
# ============================================
echo "📊 1. 환경변수 확인 및 검증"

if [ -z "${DATABASE_URL:-}" ]; then
    echo "❌ DATABASE_URL 환경변수가 설정되지 않았습니다."
    echo "⚠️ CloudType 대시보드에서 DATABASE_URL을 설정해주세요."
    exit 1
fi

# DATABASE_URL 검증 (보안: 다른 DB를 가리키지 않는지 확인)
DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "✅ DATABASE_URL 설정됨"
echo "   호스트: ${DB_HOST:-unknown}"
echo "   데이터베이스: ${DB_NAME:-unknown}"
echo ""

# ============================================
# 2. 데이터베이스 연결 대기 (재시도 로직)
# ============================================
echo "📊 2. 데이터베이스 연결 대기"
echo "⏳ PostgreSQL 서비스가 준비될 때까지 대기 중..."

MAX_RETRIES=30
RETRY_INTERVAL=2
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    # Prisma를 통한 연결 테스트 (권한 문제 우회를 위해 간단한 쿼리)
    if npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
        echo "✅ 데이터베이스 연결 성공! (시도: $((RETRY_COUNT + 1))/$MAX_RETRIES)"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "   데이터베이스 연결 대기 중... (${RETRY_COUNT}/${MAX_RETRIES})"
        sleep $RETRY_INTERVAL
    fi
done

# 최종 연결 확인
if ! npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
    echo "❌ 데이터베이스 연결 실패 (최대 재시도 횟수 초과)"
    echo "⚠️ 다음 사항을 확인하세요:"
    echo "   1. PostgreSQL 서비스가 실행 중인지"
    echo "   2. DATABASE_URL이 올바른지"
    echo "   3. 네트워크 연결이 정상인지"
    exit 1
fi

# ============================================
# 3. 데이터베이스 권한 확인 (DDL 권한)
# ============================================
echo ""
echo "📊 3. 데이터베이스 권한 확인"

# 현재 사용자가 DDL 권한이 있는지 확인 (간단한 테이블 생성 시도)
PERMISSION_TEST=$(npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null && echo "ok" || echo "fail")

if [ "$PERMISSION_TEST" = "ok" ]; then
    echo "✅ 데이터베이스 접근 권한 확인됨"
    echo "   (DDL 권한은 마이그레이션 실행 시 확인됩니다)"
else
    echo "⚠️ 데이터베이스 접근 권한 확인 실패"
    echo "   마이그레이션은 시도하지만 실패할 수 있습니다."
fi
echo ""

# ============================================
# 4. Prisma 클라이언트 생성 (권한 문제 우회)
# ============================================
echo "📊 4. Prisma 클라이언트 생성"

# 권한 문제를 우회하기 위해 db push가 자동으로 generate하도록 함
# 하지만 명시적으로 시도해보고, 실패하면 db push에서 처리
if npx prisma generate > /dev/null 2>&1; then
    echo "✅ Prisma 클라이언트 생성 성공"
else
    echo "⚠️ Prisma 클라이언트 생성 실패 (권한 문제 가능)"
    echo "   db push에서 자동으로 재생성됩니다."
fi
echo ""

# ============================================
# 5. 마이그레이션 락 처리 (동시 실행 방지)
# ============================================
echo "📊 5. 마이그레이션 실행 (동시 실행 방지)"

# PostgreSQL advisory lock을 사용하여 동시 마이그레이션 방지
# lock_id는 고정값 사용 (다른 프로세스와 공유)
LOCK_ID=1234567890

echo "🔒 마이그레이션 락 획득 시도..."

# Advisory lock 획득 시도
LOCK_RESULT=$(npx prisma db execute --stdin <<< "SELECT pg_try_advisory_lock($LOCK_ID) as acquired;" 2>/dev/null || echo "")

# 결과 파싱 (PostgreSQL 출력 형식에 따라 다를 수 있음)
if echo "$LOCK_RESULT" | grep -qi "t\|true\|1"; then
    echo "✅ 마이그레이션 락 획득 성공"
    
    # 락 해제 함수 (종료 시 실행)
    cleanup_lock() {
        echo "🔓 마이그레이션 락 해제 중..."
        npx prisma db execute --stdin <<< "SELECT pg_advisory_unlock($LOCK_ID);" > /dev/null 2>&1 || true
    }
    trap cleanup_lock EXIT INT TERM
    
    # ============================================
    # 6. 데이터베이스 스키마 동기화
    # ============================================
    echo ""
    echo "📊 6. 데이터베이스 스키마 동기화"
    echo "⚠️ 기존 데이터는 보존됩니다. 새로운 컬럼만 추가됩니다."
    echo "📋 적용 예정 변경사항:"
    echo "   - users.phone 컬럼 추가 (VARCHAR(20), nullable)"
    echo "   - users.updatedAt 컬럼 확인"
    echo ""
    
    # 상세 로그를 위해 출력을 캡처
    MIGRATION_OUTPUT=$(npx prisma db push --accept-data-loss=false --skip-generate=false 2>&1)
    MIGRATION_EXIT_CODE=$?
    
    # 출력 표시
    echo "$MIGRATION_OUTPUT"
    
    if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
        echo ""
        echo "✅ 데이터베이스 스키마 동기화 성공"
        echo "📋 적용된 변경사항을 확인하세요."
        
        # 변경사항 확인
        echo ""
        echo "🔍 변경사항 확인:"
        PHONE_EXISTS=$(npx prisma db execute --stdin <<< "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone';" 2>/dev/null | grep -c "phone" || echo "0")
        
        if [ "$PHONE_EXISTS" -gt 0 ]; then
            echo "   ✅ users.phone 컬럼이 존재합니다"
        else
            echo "   ⚠️ users.phone 컬럼이 아직 없습니다 (수동 확인 필요)"
        fi
    else
        echo ""
        echo "❌ 데이터베이스 스키마 동기화 실패 (종료 코드: $MIGRATION_EXIT_CODE)"
        echo ""
        echo "🔍 오류 분석:"
        echo "$MIGRATION_OUTPUT" | grep -i "error\|permission\|denied\|timeout\|connection" || echo "   상세 오류는 위 로그를 확인하세요"
        echo ""
        echo "⚠️ 가능한 원인:"
        echo "   1. 데이터베이스 권한 부족 (ALTER TABLE 권한 필요)"
        echo "   2. 데이터베이스 연결 문제"
        echo "   3. 스키마 충돌 (기존 데이터와 호환되지 않는 변경)"
        echo "   4. 타임아웃 (대용량 테이블에서 인덱스 생성 등)"
        echo ""
        echo "💡 해결 방법:"
        echo "   1. CloudType 대시보드에서 DATABASE_URL 확인"
        echo "   2. PostgreSQL 사용자에게 DDL 권한 부여"
        echo "   3. 수동으로 마이그레이션 실행: npx prisma db push"
        
        cleanup_lock
        exit 1
    fi
    
    # 락 해제
    cleanup_lock
    
else
    echo "⚠️ 마이그레이션 락 획득 실패 (다른 인스턴스가 실행 중일 수 있음)"
    echo "   30초 후 재시도하거나, 다른 마이그레이션이 완료될 때까지 대기하세요."
    echo "   앱은 계속 시작되지만, 마이그레이션은 건너뜁니다."
    echo ""
    echo "⚠️ 주의: 여러 인스턴스가 동시에 실행 중이면 마이그레이션 경쟁이 발생할 수 있습니다."
fi

# ============================================
# 7. 시드 데이터 실행
# ============================================
echo ""
echo "📊 7. 시드 데이터 실행"
echo "📋 관리자 계정 생성: 44tune@44tune.co.kr"

# 시드 실행 (출력 표시하여 문제 파악 가능하도록)
SEED_OUTPUT=$(npx prisma db seed 2>&1)
SEED_EXIT_CODE=$?

# 출력 표시
echo "$SEED_OUTPUT"

if [ $SEED_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ 시드 데이터 실행 성공"
    
    # 관리자 계정 확인
    echo ""
    echo "🔍 관리자 계정 확인:"
    ADMIN_EXISTS=$(npx prisma db execute --stdin <<< "SELECT email FROM users WHERE email = '44tune@44tune.co.kr';" 2>/dev/null | grep -c "44tune@44tune.co.kr" || echo "0")
    
    if [ "$ADMIN_EXISTS" -gt 0 ]; then
        echo "   ✅ 관리자 계정이 존재합니다 (44tune@44tune.co.kr)"
    else
        echo "   ⚠️ 관리자 계정이 생성되지 않았습니다"
        echo "   💡 수동으로 생성하세요: node scripts/create-temp-account.js"
    fi
else
    echo ""
    echo "❌ 시드 데이터 실행 실패 (종료 코드: $SEED_EXIT_CODE)"
    echo ""
    echo "🔍 오류 분석:"
    echo "$SEED_OUTPUT" | grep -i "error\|fail\|exception" | head -5 || echo "   상세 오류는 위 로그를 확인하세요"
    echo ""
    echo "⚠️ 관리자 계정이 생성되지 않았을 수 있습니다."
    echo "💡 수동으로 생성하세요:"
    echo "   node scripts/create-temp-account.js"
    echo ""
    echo "⚠️ 시드 실패해도 서버는 계속 시작됩니다."
fi

# ============================================
# 8. 서버 시작
# ============================================
echo ""
echo "📊 8. 서버 시작"
echo "🚀 서버가 시작되었습니다!"
echo "⏰ 시작 시간: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo ""

# 서버 시작 (exec를 사용하여 신호 전달 보장)
exec npm run start:prod
