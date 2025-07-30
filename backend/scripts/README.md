# 당첨번호 Import 스크립트

CSV 파일에서 당첨번호 데이터를 데이터베이스에 넣는 스크립트입니다.

## 📁 파일 구조

```
scripts/
├── import-winning-numbers.js    # JavaScript 버전
├── import-winning-numbers.sh    # Shell 스크립트 버전
└── README.md                   # 이 파일
```

## 🚀 사용법

### 1. npm 스크립트 사용 (권장)

```bash
# JavaScript 버전
npm run import:csv

# Shell 스크립트 버전
npm run import:csv:sh
```

### 2. 직접 실행

```bash
# JavaScript 버전
cd backend
node scripts/import-winning-numbers.js

# Shell 스크립트 버전
cd backend
./scripts/import-winning-numbers.sh
```

### 3. 서버에서 실행

```bash
# 서버 터미널에서
cd /app/backend
node scripts/import-winning-numbers.js
```

## ⚙️ 기능

### ✅ 중복 처리
- 기존에 존재하는 회차는 자동으로 건너뜀
- 중복 데이터로 인한 오류 방지

### ✅ 데이터 검증
- 회차 번호 유효성 검사
- 날짜 형식 검증
- 번호 배열 형식 검증
- 필수 필드 존재 확인

### ✅ 진행상황 표시
- 100개마다 진행상황 출력
- 성공/건너뜀/오류 개수 표시
- 상세한 오류 메시지

### ✅ 오류 처리
- CSV 파일 존재 확인
- 데이터베이스 연결 오류 처리
- 개별 레코드 오류 시에도 계속 진행

## 📊 출력 예시

```
🎯 당첨번호 CSV 파일 import 시작...
📊 총 1183개의 당첨번호 데이터를 처리합니다...
📋 기존 데이터: 0개
📈 진행상황: 100개 import 완료
📈 진행상황: 200개 import 완료
⏭️  회차 1177: 이미 존재함, 건너뜀
⏭️  회차 1176: 이미 존재함, 건너뜀

🎉 Import 완료!
✅ 성공: 1180개
⏭️  건너뜀: 3개 (이미 존재)
❌ 오류: 0개
📊 총 처리: 1183개
```

## 🔧 환경 설정

### 필수 환경변수
```bash
DATABASE_URL="postgresql://user:password@host:port/database"
```

### CSV 파일 형식
```csv
round,numbers,bonusNumber,firstWinningAmount,drawDate
1182,"[1, 13, 21, 25, 28, 31]",22,2124785424,2025-07-26
1181,"[8, 10, 14, 20, 33, 41]",28,1593643500,2025-07-19
```

## 🐛 문제 해결

### CSV 파일을 찾을 수 없는 경우
```bash
# 파일 경로 확인
ls -la backend/data/winning_numbers.csv
```

### 데이터베이스 연결 오류
```bash
# 환경변수 확인
echo $DATABASE_URL

# Prisma 클라이언트 생성
npx prisma generate
```

### 권한 오류 (Shell 스크립트)
```bash
# 실행 권한 부여
chmod +x backend/scripts/import-winning-numbers.sh
```

## 📝 참고사항

- 스크립트는 `backend/data/winning_numbers.csv` 파일을 읽습니다
- 중복 회차는 자동으로 건너뛰므로 안전하게 재실행 가능
- 대용량 데이터 처리 시 시간이 걸릴 수 있습니다
- 오류가 발생해도 성공한 데이터는 저장됩니다 