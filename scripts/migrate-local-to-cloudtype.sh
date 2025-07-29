#!/bin/bash

# 로컬 데이터를 클라우드타입으로 마이그레이션하는 스크립트

echo "🔄 로컬 데이터를 클라우드타입으로 마이그레이션 시작..."

# 1. 로컬 데이터베이스 덤프 생성
echo "📦 로컬 데이터베이스 덤프 생성 중..."
pg_dump "postgresql://postgres:postgres@localhost:5432/main" > local_dump.sql

# 2. 클라우드타입 데이터베이스로 복원
echo "🚀 클라우드타입 데이터베이스로 복원 중..."
psql "postgresql://root:tarscase12%21%40@svc.sel5.cloudtype.app:31473/main" < local_dump.sql

# 3. 임시 파일 정리
rm local_dump.sql

echo "✅ 마이그레이션 완료!" 