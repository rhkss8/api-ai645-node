#!/bin/bash

# 상용 데이터베이스 상태 확인 스크립트

echo "🔍 상용 데이터베이스 상태 확인"
echo "================================"

# 1. 헬스체크
echo "📊 1. API 헬스체크"
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.44tune.co.kr/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    echo "✅ API 헬스체크 성공"
else
    echo "❌ API 헬스체크 실패 (HTTP $HEALTH_CHECK)"
fi

# 2. 데이터베이스 연결 테스트
echo ""
echo "📊 2. 데이터베이스 연결 테스트"

# 당첨번호 조회
WINNING_NUMBERS=$(curl -s -X GET https://api.44tune.co.kr/api/data/winning-numbers/latest)
if echo "$WINNING_NUMBERS" | grep -q "success.*true"; then
    echo "✅ 당첨번호 조회 성공"
else
    echo "❌ 당첨번호 조회 실패"
    echo "응답: $WINNING_NUMBERS"
fi

# 3. 새로운 API 엔드포인트 테스트
echo ""
echo "📊 3. 새로운 API 엔드포인트 테스트"

# 임시 계정 생성 테스트
TEMP_REGISTER=$(curl -s -X POST https://api.44tune.co.kr/api/auth/temp-register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","nickname":"테스트계정"}')

if echo "$TEMP_REGISTER" | grep -q "success.*true"; then
    echo "✅ 임시 계정 생성 API 성공"
else
    echo "❌ 임시 계정 생성 API 실패"
    echo "응답: $TEMP_REGISTER"
fi

# 4. Swagger 문서 확인
echo ""
echo "📊 4. Swagger 문서 확인"
SWAGGER_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.44tune.co.kr/api-docs)
if [ "$SWAGGER_CHECK" = "200" ]; then
    echo "✅ Swagger 문서 접근 가능"
    
    # OpenAPI JSON 확인
    OPENAPI_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.44tune.co.kr/openapi.json)
    if [ "$OPENAPI_CHECK" = "200" ]; then
        echo "✅ OpenAPI JSON 접근 가능"
    else
        echo "❌ OpenAPI JSON 접근 실패 (HTTP $OPENAPI_CHECK)"
    fi
else
    echo "❌ Swagger 문서 접근 실패 (HTTP $SWAGGER_CHECK)"
fi

# 5. 새로운 엔드포인트 확인
echo ""
echo "📊 5. 새로운 엔드포인트 확인"

# 추천 파라미터 준비 API
PREPARE_CHECK=$(curl -s -X POST https://api.44tune.co.kr/api/recommend/prepare \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"conditions":{"includeNumbers":[1,2,3],"excludeNumbers":[4,5,6],"gameCount":5}}')

if echo "$PREPARE_CHECK" | grep -q "success"; then
    echo "✅ 추천 파라미터 준비 API 성공"
else
    echo "❌ 추천 파라미터 준비 API 실패"
    echo "응답: $PREPARE_CHECK"
fi

# 6. 데이터베이스 스키마 확인
echo ""
echo "📊 6. 데이터베이스 스키마 확인"

# 주문 조회 API (새로운 필드 포함)
ORDERS_CHECK=$(curl -s -X GET https://api.44tune.co.kr/api/payment/orders \
  -H "Authorization: Bearer test-token")

if echo "$ORDERS_CHECK" | grep -q "recommendation"; then
    echo "✅ 주문 API에 recommendation 필드 포함됨"
else
    echo "❌ 주문 API에 recommendation 필드 없음"
    echo "응답: $ORDERS_CHECK"
fi

echo ""
echo "🎉 상용 데이터베이스 상태 확인 완료!"
echo ""
echo "📋 다음 사항들을 확인하세요:"
echo "1. CloudType 대시보드에서 로그 확인"
echo "2. 데이터베이스 마이그레이션이 실행되었는지 확인"
echo "3. 환경변수가 올바르게 설정되었는지 확인"
echo "4. 새로운 API 엔드포인트들이 정상 작동하는지 확인" 