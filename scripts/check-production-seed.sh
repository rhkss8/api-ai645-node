#!/bin/bash

# 상용 서버 시드 상태 확인 스크립트

echo "🔍 상용 서버 시드 상태 확인"
echo "============================"

# 1. 기본 계정 로그인 테스트
echo "📊 1. 기본 계정 로그인 테스트"
LOGIN_RESPONSE=$(curl -s -X POST https://api.ai645.com/api/auth/temp-login \
  -H "Content-Type: application/json" \
  -d '{"email":"ai645@ai645.com","password":"ai645!"}')

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 기본 계정 로그인 성공"
else
    echo "❌ 기본 계정 로그인 실패"
    echo "응답: $LOGIN_RESPONSE"
fi

# 2. 임시 계정 생성 테스트
echo ""
echo "📊 2. 임시 계정 생성 테스트"
REGISTER_RESPONSE=$(curl -s -X POST https://api.ai645.com/api/auth/temp-register \
  -H "Content-Type: application/json" \
  -d '{"email":"test-seed@test.com","password":"test123","nickname":"시드테스트"}')

if echo "$REGISTER_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 임시 계정 생성 성공"
else
    echo "❌ 임시 계정 생성 실패"
    echo "응답: $REGISTER_RESPONSE"
fi

# 3. 당첨번호 조회 테스트
echo ""
echo "📊 3. 당첨번호 조회 테스트"
WINNING_RESPONSE=$(curl -s -X GET https://api.ai645.com/api/data/winning-numbers/latest)

if echo "$WINNING_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 당첨번호 조회 성공"
else
    echo "❌ 당첨번호 조회 실패"
    echo "응답: $WINNING_RESPONSE"
fi

# 4. 헬스체크
echo ""
echo "📊 4. 헬스체크"
HEALTH_RESPONSE=$(curl -s https://api.ai645.com/health)

if echo "$HEALTH_RESPONSE" | grep -q "status.*OK"; then
    echo "✅ 헬스체크 성공"
else
    echo "❌ 헬스체크 실패"
    echo "응답: $HEALTH_RESPONSE"
fi

echo ""
echo "🎉 시드 상태 확인 완료!"
echo ""
echo "📋 다음 사항들을 확인하세요:"
echo "1. CloudType 대시보드에서 로그 확인"
echo "2. 시드 실행 중 오류가 있었는지 확인"
echo "3. 데이터베이스 연결 상태 확인"
echo "4. 환경변수 DATABASE_URL 설정 확인" 