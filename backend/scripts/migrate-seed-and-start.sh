#!/bin/bash

# 마이그레이션, 시드, 서버 시작 스크립트

echo "🚀 마이그레이션, 시드, 서버 시작 스크립트"
echo "=========================================="

# 1. 환경변수 확인
echo "📊 1. 환경변수 확인"
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL 환경변수가 설정되지 않았습니다."
    echo "CloudType 대시보드에서 DATABASE_URL을 설정해주세요."
    exit 1
else
    echo "✅ DATABASE_URL 설정됨"
fi

# 2. Prisma 클라이언트 생성
echo ""
echo "📊 2. Prisma 클라이언트 생성"
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma 클라이언트 생성 성공"
else
    echo "❌ Prisma 클라이언트 생성 실패"
    exit 1
fi

# 3. 데이터베이스 스키마 동기화
echo ""
echo "📊 3. 데이터베이스 스키마 동기화"
npx prisma db push

if [ $? -eq 0 ]; then
    echo "✅ 데이터베이스 스키마 동기화 성공"
else
    echo "❌ 데이터베이스 스키마 동기화 실패"
    echo "⚠️ 데이터베이스 연결을 확인해주세요."
    exit 1
fi

# 4. 시드 데이터 실행
echo ""
echo "📊 4. 시드 데이터 실행"
npx prisma db seed

if [ $? -eq 0 ]; then
    echo "✅ 시드 데이터 실행 성공"
else
    echo "⚠️ 시드 데이터 실행 실패 (계속 진행)"
fi

# 5. 서버 시작
echo ""
echo "📊 5. 서버 시작"
echo "🚀 TypeScript 로또 추천 API 서버가 시작되었습니다!"
npm run start:prod 