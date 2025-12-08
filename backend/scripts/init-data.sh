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

# 도메인별 초기 데이터는 별도 시드로 관리합니다 (운세 도메인 전환)

# Prisma 클라이언트 생성
echo "🔧 Prisma 클라이언트 생성 중..."
DATABASE_URL="postgres://postgres:postgres@db:5432/main" npx prisma generate

echo "🎉 데이터 초기화 완료!"

# 원래 명령어 실행
exec "$@" 