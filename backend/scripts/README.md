# 🛠️ Scripts 디렉토리

이 디렉토리에는 개발 및 운영에 필요한 다양한 스크립트들이 포함되어 있습니다.

## 📋 스크립트 목록

### 1. `create-admin.js`
관리자 계정을 생성하는 스크립트입니다.

```bash
# Docker 환경에서 실행
docker-compose exec backend node scripts/create-admin.js

# 로컬 환경에서 실행
cd backend && node scripts/create-admin.js
```

### 2. `create-temp-account.js` ⭐ NEW
**결제 심사용 임시 계정을 생성하는 스크립트입니다.**

```bash
# 기본 계정 생성 (44tune@44tune.co.kr / ai645!)
docker-compose exec backend node scripts/create-temp-account.js

# 사용자 정의 계정 생성
TEMP_EMAIL=custom@example.com TEMP_PASSWORD=custom123 TEMP_NICKNAME=CustomUser \
docker-compose exec backend node scripts/create-temp-account.js custom
```

**환경변수 설정:**
```bash
# .env 파일에 추가
TEMP_EMAIL=your@email.com
TEMP_PASSWORD=yourpassword
TEMP_NICKNAME=YourName
```

### 3. `create-temp-account.sh` ⭐ NEW
**대화형 임시 계정 생성 쉘 스크립트입니다.**

```bash
# 실행 권한 부여
chmod +x backend/scripts/create-temp-account.sh

# 스크립트 실행
./backend/scripts/create-temp-account.sh
```

**특징:**
- 🎨 컬러 출력으로 사용자 친화적
- 🔍 환경 자동 감지 (Docker/로컬)
- ⚙️ 환경변수 지원
- ✅ 사용자 확인 프롬프트

### 4. `import-winning-numbers.js`
로또 당첨번호 데이터를 가져오는 스크립트입니다.

### 5. `import-winning-numbers.sh`
로또 당첨번호 가져오기 쉘 스크립트입니다.

### 6. `init-data.sh`
초기 데이터 설정 스크립트입니다.

### 7. `init-data-prod.sh`
프로덕션 환경용 초기 데이터 설정 스크립트입니다.

### 8. `test-board-api.js`
게시판 API 테스트 스크립트입니다.

## 🔐 임시 계정 (결제 심사용)

### 기본 계정 정보
```
이메일: 44tune@44tune.co.kr
비밀번호: ai645!
닉네임: AI645관리자
```

### 사용법

#### 1. 간단한 실행
```bash
# Docker 환경
docker-compose exec backend node scripts/create-temp-account.js

# 대화형 스크립트
./backend/scripts/create-temp-account.sh
```

#### 2. 사용자 정의 계정
```bash
# 환경변수로 설정
export TEMP_EMAIL=payment-review@company.com
export TEMP_PASSWORD=secure123!
export TEMP_NICKNAME=결제심사담당자

# 스크립트 실행
./backend/scripts/create-temp-account.sh
```

#### 3. 프로덕션에서 사용
```bash
# 프로덕션 서버에 파일 업로드
scp backend/scripts/create-temp-account.js user@server:/path/to/backend/scripts/
scp backend/scripts/create-temp-account.sh user@server:/path/to/

# 프로덕션에서 실행
chmod +x create-temp-account.sh
./create-temp-account.sh
```

### 로그인 테스트
```bash
curl -X POST https://your-domain.com/api/auth/temp-login \
  -H "Content-Type: application/json" \
  -d '{"email":"44tune@44tune.co.kr","password":"ai645!"}'
```

## ⚠️ 주의사항

1. **임시 계정은 결제 심사 완료 후 반드시 삭제해주세요.**
2. **프로덕션에서는 보안을 위해 복잡한 비밀번호를 사용하세요.**
3. **스크립트 실행 전 데이터베이스 백업을 권장합니다.**

## 🔧 문제 해결

### Prisma 오류
```bash
# Prisma 클라이언트 재생성
npx prisma generate

# 데이터베이스 동기화
npx prisma db push
```

### Docker 오류
```bash
# 컨테이너 재시작
docker-compose restart backend

# 로그 확인
docker-compose logs backend
``` 
