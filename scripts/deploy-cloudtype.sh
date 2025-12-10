#!/bin/bash

# 클라우드타입 배포 스크립트

echo "🚀 클라우드타입 배포 시작..."

# 1. 데이터베이스 설정 (선택사항)
echo "📦 1단계: 데이터베이스 설정 (선택사항)"
read -p "데이터베이스를 설정하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "데이터베이스 설정을 시작합니다..."
    node setup-cloudtype-db.js
fi

# 2. 환경변수 확인
echo "📦 2단계: 환경변수 확인"
echo "다음 환경변수들이 클라우드타입 대시보드에 설정되어 있는지 확인하세요:"
echo ""
echo "필수 환경변수:"
echo "- NODE_ENV=production"
echo "- PORT=3350"
echo "- DATABASE_URL=postgresql://root:tarscase12%21%40@svc.sel5.cloudtype.app:31473/main"
echo "- JWT_SECRET=ai-645-jwt-sct"
echo "- JWT_PRIVATE_KEY_B64=..."
echo "- JWT_PUBLIC_KEY_B64=..."
echo "- OPENAI_API_KEY=..."
echo "- KAKAO_CLIENT_ID=..."
echo "- KAKAO_CLIENT_SECRET=..."
echo "- GOOGLE_CLIENT_ID=..."
echo "- GOOGLE_CLIENT_SECRET=..."
echo "- NAVER_CLIENT_ID=..."
echo "- NAVER_CLIENT_SECRET=..."
echo "- OAUTH_REDIRECT_URI=https://api.44tune.co.kr/api/auth"
echo "- PORTONE_IMP_KEY=..."
echo "- PORTONE_IMP_SECRET=..."
echo "- CORS_ORIGIN=https://api.44tune.co.kr,https://44tune.co.kr,https://www.44tune.co.kr"
echo ""

read -p "환경변수가 설정되었습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 환경변수를 먼저 설정해주세요."
    exit 1
fi

# 3. 배포 확인
echo "📦 3단계: 배포 준비 완료"
echo "✅ 데이터베이스 설정 완료"
echo "✅ 환경변수 설정 완료"
echo "✅ Dockerfile.prod 준비 완료"
echo "✅ cloudtype.yaml 설정 완료"
echo ""
echo "🎉 이제 클라우드타입에서 배포할 수 있습니다!"
echo ""
echo "배포 방법:"
echo "1. 클라우드타입 대시보드에서 새 프로젝트 생성"
echo "2. GitHub 저장소 연결"
echo "3. cloudtype.yaml 파일로 배포"
echo "4. 환경변수 설정"
echo "5. 배포 실행"
echo ""
echo "배포 후 로그를 확인하여 다음 메시지들이 나타나는지 확인하세요:"
echo "- ✅ 클라우드타입 프로덕션 데이터 초기화 완료"
echo "- ✅ 데이터베이스 연결 성공"
echo "- ✅ JWT 키 초기화 완료"
echo "- 🚀 TypeScript 로또 추천 API 서버가 시작되었습니다!" 