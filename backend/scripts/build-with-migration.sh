#!/bin/bash

# 빌드 시 조건부 마이그레이션 스크립트

echo "🚀 빌드 및 마이그레이션 시작"
echo "=============================="

# 1. Prisma 클라이언트 생성
echo "📊 1. Prisma 클라이언트 생성"
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma 클라이언트 생성 성공"
else
    echo "❌ Prisma 클라이언트 생성 실패"
    exit 1
fi

# 2. 환경변수 확인 및 조건부 마이그레이션
echo ""
echo "📊 2. 데이터베이스 마이그레이션"

if [ -n "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL 환경변수 발견"
    echo "🔄 데이터베이스 스키마 동기화 중..."
    
    npx prisma db push
    
    if [ $? -eq 0 ]; then
        echo "✅ 데이터베이스 스키마 동기화 성공"
    else
        echo "⚠️ 데이터베이스 스키마 동기화 실패 (빌드는 계속 진행)"
    fi
else
    echo "⚠️ DATABASE_URL 환경변수가 없습니다. 마이그레이션을 건너뜁니다."
    echo "   런타임에서 마이그레이션이 실행됩니다."
fi

# 3. TypeScript 컴파일
echo ""
echo "📊 3. TypeScript 컴파일"
npx tsc

if [ $? -eq 0 ]; then
    echo "✅ TypeScript 컴파일 성공"
else
    echo "❌ TypeScript 컴파일 실패"
    exit 1
fi

echo ""
echo "🎉 빌드 완료!" 