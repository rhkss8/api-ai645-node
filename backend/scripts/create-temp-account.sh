#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 AI645 임시 계정 생성 스크립트${NC}"
echo "=================================================="

# 환경 확인
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env 파일을 찾았습니다.${NC}"
    source .env
else
    echo -e "${YELLOW}⚠️ .env 파일이 없습니다.${NC}"
fi

# 기본값 설정
DEFAULT_EMAIL="ai645@ai645.com"
DEFAULT_PASSWORD="ai645!"
DEFAULT_NICKNAME="AI645관리자"

# 환경변수 또는 기본값 사용
EMAIL=${TEMP_EMAIL:-$DEFAULT_EMAIL}
PASSWORD=${TEMP_PASSWORD:-$DEFAULT_PASSWORD}
NICKNAME=${TEMP_NICKNAME:-$DEFAULT_NICKNAME}

echo -e "${BLUE}📋 계정 정보:${NC}"
echo "   이메일: $EMAIL"
echo "   비밀번호: $PASSWORD"
echo "   닉네임: $NICKNAME"
echo ""

# 사용자 확인
read -p "이 정보로 계정을 생성하시겠습니까? (y/N): " confirm
if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo -e "${YELLOW}❌ 계정 생성을 취소했습니다.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 계정 생성을 시작합니다...${NC}"

# Docker 환경에서 실행
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}🐳 Docker 환경에서 실행합니다.${NC}"
    
    # Docker 컨테이너에서 스크립트 실행
    docker-compose exec backend node scripts/create-temp-account.js
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ 계정 생성이 완료되었습니다!${NC}"
        echo ""
        echo -e "${BLUE}🔗 로그인 테스트:${NC}"
        echo "curl -X POST http://localhost:3350/api/auth/temp-login \\"
        echo "  -H \"Content-Type: application/json\" \\"
        echo "  -d '{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}'"
    else
        echo -e "${RED}❌ 계정 생성에 실패했습니다.${NC}"
        exit 1
    fi
    
# 로컬 환경에서 실행
elif command -v node &> /dev/null; then
    echo -e "${GREEN}📦 로컬 Node.js 환경에서 실행합니다.${NC}"
    
    # 로컬에서 스크립트 실행
    TEMP_EMAIL="$EMAIL" TEMP_PASSWORD="$PASSWORD" TEMP_NICKNAME="$NICKNAME" node scripts/create-temp-account.js custom
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ 계정 생성이 완료되었습니다!${NC}"
    else
        echo -e "${RED}❌ 계정 생성에 실패했습니다.${NC}"
        exit 1
    fi
    
else
    echo -e "${RED}❌ Docker나 Node.js를 찾을 수 없습니다.${NC}"
    echo "Docker Compose 또는 Node.js가 설치되어 있는지 확인해주세요."
    exit 1
fi

echo ""
echo -e "${BLUE}📚 사용법:${NC}"
echo "1. 환경변수로 설정:"
echo "   export TEMP_EMAIL=your@email.com"
echo "   export TEMP_PASSWORD=yourpassword"
echo "   export TEMP_NICKNAME=YourName"
echo ""
echo "2. .env 파일에 추가:"
echo "   TEMP_EMAIL=your@email.com"
echo "   TEMP_PASSWORD=yourpassword"
echo "   TEMP_NICKNAME=YourName"
echo ""
echo -e "${GREEN}🎉 완료!${NC}" 