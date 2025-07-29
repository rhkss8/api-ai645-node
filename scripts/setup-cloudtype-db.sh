#!/bin/bash

# 클라우드타입 PostgreSQL 설정 및 마이그레이션 스크립트

echo "🔧 클라우드타입 PostgreSQL 설정 시작..."

# 1. main 데이터베이스 생성
echo "📦 main 데이터베이스 생성 중..."
psql "postgresql://root:tarscase12%21%40@svc.sel5.cloudtype.app:31473/postgres" -c "CREATE DATABASE main;"

if [ $? -eq 0 ]; then
    echo "✅ main 데이터베이스 생성 완료"
else
    echo "⚠️  main 데이터베이스가 이미 존재하거나 생성 실패"
fi

# 2. Prisma 클라이언트 생성
echo "🔨 Prisma 클라이언트 생성 중..."
npx prisma generate

# 3. 데이터베이스 마이그레이션
echo "🚀 데이터베이스 마이그레이션 시작..."
npx prisma db push

# 4. 초기 데이터 삽입 (선택사항)
echo "📊 초기 데이터 삽입 중..."
node scripts/importWinningNumbers.js

echo "✅ 클라우드타입 PostgreSQL 설정 완료!" 