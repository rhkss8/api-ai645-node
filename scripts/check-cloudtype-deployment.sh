#!/bin/bash

# CloudType 배포 상태 확인 스크립트

echo "🔍 CloudType 배포 상태 확인"
echo "================================"

# 1. 헬스체크
echo "📊 1. 헬스체크 확인"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.ai645.com/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✅ 헬스체크 성공"
else
    echo "❌ 헬스체크 실패 (HTTP $HEALTH_CHECK)"
fi

# 2. API 엔드포인트 테스트
echo ""
echo "📊 2. API 엔드포인트 테스트"

# Swagger 확인
SWAGGER_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.ai645.com/api-docs)
if [ "$SWAGGER_CHECK" = "200" ]; then
    echo "✅ Swagger 문서 접근 가능"
else
    echo "❌ Swagger 문서 접근 실패 (HTTP $SWAGGER_CHECK)"
fi

# 3. 데이터베이스 연결 테스트
echo ""
echo "📊 3. 데이터베이스 연결 테스트"
DB_TEST=$(curl -s -X GET https://api.ai645.com/api/data/winning-numbers/latest)
if echo "$DB_TEST" | grep -q "success"; then
    echo "✅ 데이터베이스 연결 성공"
else
    echo "❌ 데이터베이스 연결 실패"
    echo "응답: $DB_TEST"
fi

# 4. 임시 계정 로그인 테스트
echo ""
echo "📊 4. 임시 계정 로그인 테스트"
LOGIN_RESPONSE=$(curl -s -X POST https://api.ai645.com/api/auth/temp-login \
  -H "Content-Type: application/json" \
  -d '{"email":"ai645@ai645.com","password":"ai645!"}')

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    echo "✅ 임시 계정 로그인 성공"
    # JWT 토큰 추출
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
    echo "🔑 JWT 토큰 발급됨"
else
    echo "❌ 임시 계정 로그인 실패"
    echo "응답: $LOGIN_RESPONSE"
fi

# 5. 프로필 조회 테스트 (토큰이 있는 경우)
if [ ! -z "$TOKEN" ]; then
    echo ""
    echo "📊 5. 프로필 조회 테스트"
    PROFILE_RESPONSE=$(curl -s -X GET https://api.ai645.com/api/auth/profile \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$PROFILE_RESPONSE" | grep -q "success.*true"; then
        echo "✅ 프로필 조회 성공"
    else
        echo "❌ 프로필 조회 실패"
        echo "응답: $PROFILE_RESPONSE"
    fi
fi

echo ""
echo "🎉 배포 상태 확인 완료!"
echo ""
echo "📋 다음 사항들을 확인하세요:"
echo "1. CloudType 대시보드에서 로그 확인"
echo "2. 환경변수가 올바르게 설정되었는지 확인"
echo "3. PostgreSQL 연결이 정상인지 확인"
echo "4. 도메인 SSL 인증서가 발급되었는지 확인" 