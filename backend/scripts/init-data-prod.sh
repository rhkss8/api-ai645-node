#!/bin/bash

# 클라우드타입 프로덕션 데이터 초기화 스크립트
# 이 스크립트는 클라우드타입에서 실행됩니다.

set -e  # 오류 발생 시 스크립트 중단

echo "🚀 클라우드타입 프로덕션 데이터 초기화 스크립트 시작..."

# 환경변수는 실행 환경에서 주입됩니다 (DATABASE_URL 필수)

# 데이터베이스 연결 대기 (최대 60초)
echo "⏳ 클라우드타입 데이터베이스 연결 대기 중..."
for i in {1..30}; do
  if npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
    echo "✅ 클라우드타입 데이터베이스 연결 성공!"
    break
  fi
  echo "   데이터베이스 연결 대기 중... (${i}/30)"
  sleep 2
done

# 데이터베이스 연결 확인
if ! npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
  echo "❌ 데이터베이스 연결 실패. 스크립트를 종료합니다."
  exit 1
fi

# main 데이터베이스 확인 및 생성
echo "📦 main 데이터베이스 확인 중..."
if ! npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
  echo "⚠️  main 데이터베이스가 존재하지 않습니다. 생성 중..."
  # Node.js 스크립트로 데이터베이스 생성
  if [ -f "setup-cloudtype-db.js" ]; then
    node setup-cloudtype-db.js
  else
    echo "⚠️  setup-cloudtype-db.js 파일이 없습니다. 수동으로 데이터베이스를 생성해주세요."
  fi
fi

# Prisma 마이그레이션 실행
echo "🔄 Prisma 마이그레이션 실행 중..."
npx prisma db push

# 도메인별 초기 데이터는 별도 시드로 관리합니다 (운세 도메인 전환)

# Prisma 클라이언트 생성
echo "🔧 Prisma 클라이언트 생성 중..."
npx prisma generate

echo "🎉 클라우드타입 프로덕션 데이터 초기화 완료!"

# 원래 명령어 실행 (애플리케이션 시작)
echo "🚀 애플리케이션 시작 중..."
exec "$@" 