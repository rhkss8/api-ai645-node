#!/bin/bash

# 데이터 초기화 스크립트
# 이 스크립트는 백엔드 컨테이너가 시작될 때 실행됩니다.

echo "🚀 데이터 초기화 스크립트 시작..."

# 데이터베이스 연결 대기
echo "⏳ 데이터베이스 연결 대기 중..."
until DATABASE_URL="postgres://postgres:postgres@db:5432/main" npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; do
  echo "   데이터베이스 연결 대기 중..."
  sleep 2
done

echo "✅ 데이터베이스 연결 성공!"

# Prisma 마이그레이션 실행
echo "🔄 Prisma 마이그레이션 실행 중..."
DATABASE_URL="postgres://postgres:postgres@db:5432/main" npx prisma migrate deploy

# 당첨번호 데이터 확인 및 import
echo "📊 당첨번호 데이터 확인 중..."
WINNING_COUNT=$(DATABASE_URL="postgres://postgres:postgres@db:5432/main" npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM winning_numbers" | grep -o '[0-9]*' | tail -1)

if [ "$WINNING_COUNT" -eq 0 ]; then
    echo "⚠️  당첨번호 데이터가 없습니다. CSV에서 import를 시작합니다..."
    DATABASE_URL="postgres://postgres:postgres@db:5432/main" npx ts-node src/scripts/importWinningNumbers.ts
    echo "✅ 당첨번호 데이터 import 완료!"
else
    echo "✅ 당첨번호 데이터가 이미 존재합니다. (${WINNING_COUNT}개)"
fi

# Prisma 클라이언트 생성
echo "🔧 Prisma 클라이언트 생성 중..."
DATABASE_URL="postgres://postgres:postgres@db:5432/main" npx prisma generate

echo "🎉 데이터 초기화 완료!"

# 원래 명령어 실행
exec "$@" 