#!/bin/bash

# 시드만 실행하는 스크립트

echo "🌱 시드 실행 스크립트"
echo "===================="

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

# 3. 시드 데이터 실행
echo ""
echo "📊 3. 시드 데이터 실행"
npx prisma db seed

if [ $? -eq 0 ]; then
    echo "✅ 시드 데이터 실행 성공"
    echo ""
    echo "📋 생성된 데이터:"
    echo "- 기본 이메일 계정: ai645@ai645.com"
    echo "- 샘플 당첨번호: 5회차"
    echo "- 샘플 추천 파라미터: 1개"
    echo ""
    echo "🔗 테스트 계정:"
    echo "이메일: ai645@ai645.com"
    echo "비밀번호: ai645!"
else
    echo "❌ 시드 데이터 실행 실패"
    exit 1
fi

echo ""
echo "🎉 시드 실행 완료!" 