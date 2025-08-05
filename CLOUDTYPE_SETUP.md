# 🚀 CloudType 상용 배포 설정 가이드

## 📋 필수 환경변수 설정

CloudType 대시보드에서 다음 환경변수들을 설정해주세요:

### 🔐 필수 환경변수
```bash
# 데이터베이스 연결
DATABASE_URL=postgresql://username:password@host:port/database

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-here

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here

# 서버 설정
NODE_ENV=production
PORT=4000
```

### 🌐 선택 환경변수
```bash
# CORS 설정
CORS_ORIGIN=https://api.ai645.com,https://ai645.com,https://www.ai645.com

# 로깅 설정
LOG_LEVEL=info
API_VERSION=v1
```

## 🔧 설정 방법

### 1. CloudType 대시보드 접속
1. https://cloudtype.io 접속
2. 프로젝트 선택: `api-ai645-node`
3. Settings → Environment Variables

### 2. 환경변수 추가
각 환경변수를 개별적으로 추가:
- Key: `DATABASE_URL`
- Value: `postgresql://username:password@host:port/database`

### 3. 배포 재실행
환경변수 설정 후:
1. Deployments → 최신 배포 선택
2. "Redeploy" 클릭

## 🔍 문제 해결

### 문제 1: "No build required"
**해결방법:**
```bash
# 로컬에서 강제 빌드 트리거
echo "// Force rebuild: $(date)" >> backend/src/index.ts
git add . && git commit -m "Force rebuild" && git push origin main
```

### 문제 2: 새로운 API 엔드포인트가 작동하지 않음
**해결방법:**
1. CloudType 로그 확인
2. 환경변수 설정 확인
3. 강제 재배포 실행

### 문제 3: 데이터베이스 마이그레이션 실패
**해결방법:**
```bash
# 로컬에서 마이그레이션 확인
cd backend
npx prisma generate
npx prisma db push
```

## 📊 배포 확인

### 1. 헬스체크
```bash
curl https://api.ai645.com/health
```

### 2. 새로운 API 테스트
```bash
# 임시 계정 생성
curl -X POST https://api.ai645.com/api/auth/temp-register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","nickname":"테스트"}'

# 추천 파라미터 준비
curl -X POST https://api.ai645.com/api/recommend/prepare \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{"conditions":{"includeNumbers":[1,2,3],"excludeNumbers":[4,5,6],"gameCount":5}}'
```

### 3. Swagger 문서 확인
```bash
curl https://api.ai645.com/api-docs
curl https://api.ai645.com/openapi.json
```

## ⚠️ 주의사항

1. **환경변수 보안**: 민감한 정보는 CloudType 대시보드에서만 설정
2. **데이터베이스 백업**: 마이그레이션 전 백업 권장
3. **도메인 설정**: SSL 인증서 발급 확인
4. **로그 모니터링**: CloudType 대시보드에서 로그 확인

## 🎯 완료 체크리스트

- [ ] CloudType 환경변수 설정 완료
- [ ] 강제 재배포 실행
- [ ] 헬스체크 성공
- [ ] 새로운 API 엔드포인트 작동 확인
- [ ] Swagger 문서 접근 가능
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 임시 계정 생성/로그인 테스트
- [ ] 프리미엄 추천 플로우 테스트

## 📞 지원

문제가 지속되면:
1. CloudType 대시보드 로그 확인
2. 환경변수 설정 재확인
3. 강제 재배포 실행
4. 데이터베이스 연결 상태 확인 