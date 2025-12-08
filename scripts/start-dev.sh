#!/bin/bash

# 개발 환경 Docker 시작 스크립트

set -e

echo "🚀 포포춘 운세 서비스 개발 서버 시작 중..."

# Docker 실행 확인
if ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되어 있지 않습니다."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker daemon이 실행되지 않았습니다."
    echo "   Docker Desktop을 시작해주세요."
    exit 1
fi

# 프로젝트 루트로 이동
cd "$(dirname "$0")/.."

# .env 파일 확인
if [ ! -f "./backend/.env" ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 복사하여 생성합니다..."
    cp ./backend/.env.example ./backend/.env
    echo "✅ .env 파일을 생성했습니다. 필수 환경 변수를 설정해주세요:"
    echo "   - DATABASE_URL"
    echo "   - OPENAI_API_KEY"
    echo "   - JWT_SECRET"
    exit 1
fi

# 기존 컨테이너 중지 및 제거
echo "🧹 기존 컨테이너 정리 중..."
docker-compose down || true

# Docker 이미지 빌드
echo "🔨 Docker 이미지 빌드 중..."
docker-compose build

# 데이터베이스와 백엔드 시작
echo "📦 컨테이너 시작 중..."
docker-compose up -d db

# 데이터베이스 준비 대기
echo "⏳ 데이터베이스 준비 대기 중..."
sleep 5

# 백엔드 시작
echo "🚀 백엔드 서버 시작 중..."
docker-compose up -d backend

# 로그 출력
echo ""
echo "✅ 서버가 시작되었습니다!"
echo ""
echo "📍 API 서버: http://localhost:3350"
echo "📚 Swagger 문서: http://localhost:3350/api-docs"
echo "🗄️  데이터베이스: localhost:3236"
echo ""
echo "📋 로그 확인: docker-compose logs -f backend"
echo "🛑 서버 중지: docker-compose down"
echo ""

# 로그 보기 (옵션)
read -p "로그를 지금 보시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose logs -f backend
fi
