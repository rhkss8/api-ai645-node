# CloudType 배포 가이드

## 📋 배포 전 준비사항

### 1. 환경변수 설정
CloudType 대시보드에서 다음 환경변수들을 설정해야 합니다:

#### 필수 환경변수
```bash
# 데이터베이스 설정
DATABASE_URL=postgresql://username:password@host:port/database

# 서버 설정
NODE_ENV=production
PORT=8080

# JWT 설정
JWT_SECRET=your-secret-key-here
JWT_PRIVATE_KEY_PATH=./keys/jwt_private.pem
JWT_PUBLIC_KEY_PATH=./keys/jwt_public.pem
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=14d

# OpenAI 설정
OPENAI_API_KEY=your-openai-api-key

# OAuth 설정
KAKAO_CLIENT_ID=your-kakao-client-id
KAKAO_CLIENT_SECRET=your-kakao-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NAVER_CLIENT_ID=your-naver-client-id
NAVER_CLIENT_SECRET=your-naver-client-secret
OAUTH_REDIRECT_URI=https://your-domain.com/api/auth

# PortOne V2 설정
V2_API_SECRET=your-portone-v2-api-secret
V2_WEBHOOK_SECRET=your-portone-v2-webhook-secret
```

### 2. 데이터베이스 설정
- PostgreSQL 데이터베이스가 필요합니다
- CloudType에서 제공하는 PostgreSQL 서비스를 사용하거나 외부 데이터베이스를 연결할 수 있습니다

### 3. JWT 키 파일
- `keys/jwt_private.pem`과 `keys/jwt_public.pem` 파일이 필요합니다
- 이 파일들은 보안상 Git에 포함되지 않으므로 별도로 업로드해야 합니다

## 🚀 배포 단계

### 1. CloudType 대시보드 접속
- [CloudType 대시보드](https://app.cloudtype.io)에 접속

### 2. 새 프로젝트 생성
- "New Project" 클릭
- Git 저장소 연결 또는 직접 업로드

### 3. 빌드 설정
- **Dockerfile Path**: `Dockerfile` (루트에 위치)
- **Build Context**: `.` (루트 디렉토리)
- **Port**: `8080`

### 4. 환경변수 설정
- 위의 필수 환경변수들을 모두 설정
- 특히 `DATABASE_URL`은 올바른 PostgreSQL 연결 문자열이어야 함

### 5. 배포 실행
- "Deploy" 버튼 클릭
- 빌드 및 배포 진행 상황 모니터링

## 🔧 배포 후 확인사항

### 1. 헬스체크
```bash
curl https://your-domain.com/health
```

### 2. API 문서 확인
```bash
curl https://your-domain.com/api-docs
```

### 3. 로그 확인
- CloudType 대시보드에서 실시간 로그 확인
- 에러가 있는지 확인

## 🐛 문제 해결

### 1. 빌드 실패
- Dockerfile 경로가 올바른지 확인
- 환경변수가 모두 설정되었는지 확인

### 2. 데이터베이스 연결 실패
- `DATABASE_URL`이 올바른지 확인
- 데이터베이스가 실행 중인지 확인
- 방화벽 설정 확인

### 3. JWT 키 파일 문제
- JWT 키 파일이 올바른 경로에 있는지 확인
- 파일 권한이 올바른지 확인

### 4. 포트 문제
- CloudType에서 포트 8080이 올바르게 설정되었는지 확인
- 애플리케이션이 포트 8080에서 실행되는지 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. CloudType 대시보드의 로그
2. 애플리케이션 로그
3. 환경변수 설정
4. 데이터베이스 연결 상태 