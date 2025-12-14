# 마이그레이션 문제 분석 및 해결 방안

## 🔍 문제 상황

배포를 했는데도 `users.phone` 컬럼이 생성되지 않았습니다.

## 📋 현재 설정 확인

### 1. 배포 프로세스

**Dockerfile.prod** (line 53):
```dockerfile
CMD ["./scripts/migrate-seed-and-start.sh"]
```

**migrate-seed-and-start.sh** (line 33):
```bash
npx prisma db push
```

✅ **이론적으로는 배포 시 자동으로 마이그레이션이 실행되어야 합니다.**

### 2. 가능한 문제 원인

#### 원인 1: Prisma 클라이언트가 빌드 시점에 생성됨 ⚠️

**Dockerfile.prod** (line 25):
```dockerfile
RUN npx prisma generate
```

**문제점:**
- 빌드 시점에 Prisma 클라이언트가 생성됨
- 이때는 `DATABASE_URL`이 없거나 다른 스키마를 참조할 수 있음
- 런타임에 `prisma db push`를 실행해도 이미 생성된 클라이언트가 사용됨

**해결책:**
- 런타임에 Prisma 클라이언트를 재생성해야 함
- `migrate-seed-and-start.sh`에서 이미 `npx prisma generate`를 실행하고 있음 ✅

#### 원인 2: `prisma db push` 실패했지만 로그를 확인하지 않음

**가능성:**
- 마이그레이션이 실패했지만 배포는 계속 진행됨
- 스크립트는 `exit 1`로 종료하도록 되어 있지만, 실제로는 실패했을 수 있음

**확인 방법:**
- CloudType 배포 로그에서 다음 메시지 확인:
  ```
  ✅ 데이터베이스 스키마 동기화 성공
  또는
  ❌ 데이터베이스 스키마 동기화 실패
  ```

#### 원인 3: 스키마 파일이 최신이 아님

**가능성:**
- Git에 푸시되지 않은 스키마 변경사항
- 배포된 코드의 `schema.prisma`에 `phone` 필드가 없을 수 있음

**확인 방법:**
- 배포된 컨테이너에서 확인:
  ```bash
  cat prisma/schema.prisma | grep phone
  ```

#### 원인 4: 데이터베이스 권한 문제

**가능성:**
- `prisma db push` 실행 시 ALTER TABLE 권한이 없을 수 있음
- PostgreSQL 사용자에게 테이블 수정 권한이 없을 수 있음

## ✅ 해결 방안

### 방법 1: 배포 로그 확인 (우선 확인)

1. **CloudType 대시보드 접속**
2. **배포 로그 확인**
   - 최근 배포의 로그를 확인
   - 다음 메시지 찾기:
     ```
     📊 3. 데이터베이스 스키마 동기화
     ✅ 데이터베이스 스키마 동기화 성공
     또는
     ❌ 데이터베이스 스키마 동기화 실패
     ```

### 방법 2: 수동 마이그레이션 실행 (안전, 권장) ⭐

**DB 삭제 없이 안전하게 실행 가능합니다!**

1. **CloudType 터미널 접속**
2. **다음 명령어 실행:**

```bash
# 1. 현재 스키마 확인
cat prisma/schema.prisma | grep -A 5 "model User"

# 2. Prisma 클라이언트 재생성 (중요!)
npx prisma generate

# 3. 데이터베이스 스키마 동기화 (기존 데이터 보존)
npx prisma db push --accept-data-loss=false

# 4. 확인
npx prisma db execute --stdin <<< "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone';"
```

**`prisma db push`는 안전합니다:**
- ✅ 기존 데이터를 삭제하지 않음
- ✅ 새로운 컬럼만 추가함
- ✅ 기존 컬럼은 그대로 유지
- ✅ `--accept-data-loss=false` 옵션으로 데이터 손실 방지

### 방법 3: 스크립트 개선 (향후 방지)

마이그레이션 실패 시 더 명확한 로그를 남기도록 스크립트 개선:

```bash
# migrate-seed-and-start.sh 개선안
npx prisma db push --skip-generate 2>&1 | tee /tmp/migration.log

if [ $? -eq 0 ]; then
    echo "✅ 데이터베이스 스키마 동기화 성공"
    cat /tmp/migration.log
else
    echo "❌ 데이터베이스 스키마 동기화 실패"
    echo "상세 로그:"
    cat /tmp/migration.log
    exit 1
fi
```

## 🔒 안전성 확인

### `prisma db push`는 안전합니다

1. **기존 데이터 보존**
   - 기존 테이블과 데이터는 그대로 유지
   - 새로운 컬럼만 추가됨

2. **데이터 손실 없음**
   - `--accept-data-loss=false` (기본값)
   - 데이터를 삭제하는 작업은 수행하지 않음

3. **롤백 가능**
   - 문제 발생 시 스키마를 이전 버전으로 되돌릴 수 있음

## 📋 체크리스트

배포 후 확인 사항:

- [ ] 배포 로그에서 "✅ 데이터베이스 스키마 동기화 성공" 메시지 확인
- [ ] 터미널에서 `users` 테이블 구조 확인
- [ ] 소셜 로그인 테스트
- [ ] 이메일 로그인 테스트

## 🚀 권장 조치

1. **즉시 조치**: 방법 2 (수동 마이그레이션) 실행
2. **원인 파악**: 배포 로그 확인
3. **향후 방지**: 스크립트 개선 및 로그 강화

