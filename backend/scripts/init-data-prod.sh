#!/bin/bash

# 클라우드타입 프로덕션 데이터 초기화 스크립트
# 이 스크립트는 클라우드타입에서 실행됩니다.

set -e  # 오류 발생 시 스크립트 중단

echo "🚀 클라우드타입 프로덕션 데이터 초기화 스크립트 시작..."

# 환경변수 설정
export DATABASE_URL="postgresql://root:tarscase12%21%40@svc.sel5.cloudtype.app:31473/main"

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

# 당첨번호 데이터 확인 및 import
echo "📊 당첨번호 데이터 확인 중..."
WINNING_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM winning_numbers" 2>/dev/null | grep -o '[0-9]*' | tail -1 || echo "0")

if [ "$WINNING_COUNT" -eq 0 ]; then
    echo "⚠️  당첨번호 데이터가 없습니다. CSV에서 import를 시작합니다..."
    if [ -f "src/scripts/importWinningNumbers.ts" ]; then
        npx ts-node src/scripts/importWinningNumbers.ts
        echo "✅ 당첨번호 데이터 import 완료!"
    else
        echo "⚠️  importWinningNumbers.ts 파일이 없습니다."
    fi
else
    echo "✅ 당첨번호 데이터가 이미 존재합니다. (${WINNING_COUNT}개)"
fi

# Prisma 클라이언트 생성
echo "🔧 Prisma 클라이언트 생성 중..."
npx prisma generate

echo "🎉 클라우드타입 프로덕션 데이터 초기화 완료!"

# 원래 명령어 실행 (애플리케이션 시작)
echo "🚀 애플리케이션 시작 중..."
exec "$@" 