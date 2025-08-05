#!/bin/bash

# 상용 서버 환경변수 및 데이터베이스 상태 확인 스크립트

echo "🔍 상용 서버 환경변수 및 데이터베이스 상태 확인"
echo "================================================"

# 1. 환경변수 확인
echo "📊 1. 환경변수 확인"
echo "DATABASE_URL: ${DATABASE_URL:+설정됨}"
echo "NODE_ENV: ${NODE_ENV:-설정되지 않음}"
echo "JWT_SECRET: ${JWT_SECRET:+설정됨}"
echo "KAKAO_CLIENT_ID: ${KAKAO_CLIENT_ID:+설정됨}"
echo "KAKAO_CLIENT_SECRET: ${KAKAO_CLIENT_SECRET:+설정됨}"

# 2. 현재 디렉토리 및 파일 확인
echo ""
echo "📊 2. 현재 디렉토리 확인"
pwd
ls -la

# 3. Prisma 스키마 확인
echo ""
echo "📊 3. Prisma 스키마 확인"
if [ -f "prisma/schema.prisma" ]; then
    echo "✅ Prisma 스키마 파일 존재"
    grep -A 10 "model User" prisma/schema.prisma
else
    echo "❌ Prisma 스키마 파일 없음"
fi

# 4. 데이터베이스 연결 테스트
echo ""
echo "📊 4. 데이터베이스 연결 테스트"
if [ -n "$DATABASE_URL" ]; then
    echo "🔄 데이터베이스 연결 테스트 중..."
    
    # Prisma 클라이언트 생성
    npx prisma generate
    
    # 데이터베이스 스키마 확인
    npx prisma db pull --print
    
    echo "✅ 데이터베이스 연결 성공"
else
    echo "❌ DATABASE_URL 환경변수가 설정되지 않음"
fi

# 5. 현재 데이터베이스 상태 확인
echo ""
echo "📊 5. 현재 데이터베이스 상태 확인"
if [ -n "$DATABASE_URL" ]; then
    echo "🔄 데이터베이스 스키마 확인 중..."
    
    # User 테이블 구조 확인
    npx prisma db execute --stdin <<< "
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY ordinal_position;
    "
    
    echo "✅ 데이터베이스 스키마 확인 완료"
else
    echo "⚠️ DATABASE_URL이 없어서 데이터베이스 확인 불가"
fi

# 6. 마이그레이션 필요 여부 확인
echo ""
echo "📊 6. 마이그레이션 필요 여부 확인"
if [ -n "$DATABASE_URL" ]; then
    echo "🔄 마이그레이션 상태 확인 중..."
    
    # 스키마 차이 확인
    npx prisma migrate diff \
        --from-empty \
        --to-schema-datamodel prisma/schema.prisma \
        --exit-code
    
    if [ $? -eq 0 ]; then
        echo "✅ 데이터베이스가 최신 상태입니다"
    else
        echo "⚠️ 마이그레이션이 필요합니다"
    fi
else
    echo "⚠️ DATABASE_URL이 없어서 마이그레이션 확인 불가"
fi

echo ""
echo "🎉 환경변수 및 데이터베이스 상태 확인 완료!" 