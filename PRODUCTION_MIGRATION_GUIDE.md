# 🚀 상용 서버 마이그레이션 가이드

## 🔍 현재 문제
- `The column 'users.email' does not exist in the current database`
- 소셜 로그인 실패
- 데이터베이스 스키마가 최신 상태가 아님

## 🔧 해결 방법

### 1. CloudType 터미널 접속
1. CloudType 대시보드 접속
2. 프로젝트 선택: `api-ai645-node`
3. Terminal 탭 클릭

### 2. 마이그레이션 실행

```bash
# 1. 현재 디렉토리 확인
pwd
ls -la

# 2. scripts 디렉토리로 이동
cd /app/scripts

# 3. 스크립트 권한 부여
chmod +x migrate-and-start.sh

# 4. 마이그레이션 실행
./migrate-and-start.sh
```

### 3. 수동 마이그레이션 (대안)

만약 스크립트가 작동하지 않는다면:

```bash
# 1. Prisma 클라이언트 생성
npx prisma generate

# 2. 데이터베이스 스키마 동기화 (기존 데이터 유지)
npx prisma db push

# 3. 서버 재시작
npm run start:prod
```

### 4. 환경변수 확인

```bash
# 필수 환경변수 확인
echo $DATABASE_URL
echo $NODE_ENV
echo $JWT_SECRET
echo $KAKAO_CLIENT_ID
echo $KAKAO_CLIENT_SECRET
```

### 5. 마이그레이션 후 확인

```bash
# 1. 헬스체크
curl https://api.44tune.co.kr/health

# 2. 임시 계정 생성 테스트
curl -X POST https://api.44tune.co.kr/api/auth/temp-register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","nickname":"테스트"}'

# 3. 소셜 로그인 테스트
# 브라우저에서 https://api.44tune.co.kr/api/auth/kakao 접속
```

## ⚠️ 주의사항

1. **데이터 백업**: 마이그레이션 전 데이터베이스 백업 권장
2. **환경변수**: CloudType 대시보드에서 모든 환경변수 설정 확인
3. **OAuth 설정**: 카카오 개발자 콘솔에서 콜백 URL 확인

## 📋 체크리스트

- [ ] CloudType 터미널 접속
- [ ] 마이그레이션 스크립트 실행
- [ ] 환경변수 확인
- [ ] 서버 재시작
- [ ] 헬스체크 성공
- [ ] 임시 계정 생성 테스트
- [ ] 소셜 로그인 테스트

## 🔍 문제 해결

### 마이그레이션 실패 시
```bash
# 1. 로그 확인
docker-compose logs backend

# 2. 강제 스키마 동기화
npx prisma db push --force-reset

# 3. 서버 재시작
npm run start:prod
```

### OAuth 오류 시
1. 카카오 개발자 콘솔에서 콜백 URL 확인
2. CloudType 환경변수 재확인
3. 브라우저 캐시 삭제 후 재시도 