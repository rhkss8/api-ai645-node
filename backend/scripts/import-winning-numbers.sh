#!/bin/bash

# 당첨번호 CSV 파일 import 스크립트
# 중복 회차는 건너뛰고 실행

set -e  # 오류 발생 시 스크립트 중단

echo "🎯 당첨번호 CSV 파일 import 시작..."

# 스크립트 디렉토리로 이동
cd "$(dirname "$0")"

# CSV 파일 경로 확인
CSV_FILE="../data/winning_numbers.csv"

if [ ! -f "$CSV_FILE" ]; then
    echo "❌ CSV 파일을 찾을 수 없습니다: $CSV_FILE"
    exit 1
fi

echo "📊 CSV 파일 확인됨: $CSV_FILE"

# Node.js 스크립트 실행
echo "🚀 JavaScript import 스크립트 실행 중..."
node import-winning-numbers.js

echo "✅ Shell 스크립트 완료!" 