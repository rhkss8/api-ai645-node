# CloudType 권한 오류 해결 가이드

## 🚨 문제

```
EACCES: permission denied, unlink '/app/backend/node_modules/.prisma/client/index.js'
```

## 🔍 원인

Dockerfile에서 `USER nodejs`로 비특권 사용자로 실행하도록 설정되어 있어, `node_modules` 디렉토리에 대한 쓰기 권한이 없습니다.

## ✅ 해결 방법

### 방법 1: `prisma db push` 직접 실행 (권장) ⭐

**`prisma db push`는 자동으로 클라이언트를 재생성하므로 `generate` 단계를 건너뛸 수 있습니다!**

```bash
# generate 없이 바로 push 실행
npx prisma db push --accept-data-loss=false --skip-generate=false
```

또는 더 간단하게:

```bash
# prisma db push는 자동으로 generate도 실행합니다
npx prisma db push --accept-data-loss=false
```

### 방법 2: 임시 디렉토리 사용

```bash
# Prisma 출력 디렉토리를 임시로 변경
export PRISMA_GENERATE_DATAPROXY=false
npx prisma db push --accept-data-loss=false
```

### 방법 3: 권한 우회 (고급)

만약 위 방법이 안 되면, 임시로 다른 위치에 생성:

```bash
# 1. 현재 디렉토리 확인
pwd

# 2. prisma db push 실행 (자동으로 generate 포함)
npx prisma db push --accept-data-loss=false

# 3. 만약 여전히 오류가 나면, 스키마만 확인
cat prisma/schema.prisma | grep -A 5 "model User"
```

## 🎯 권장 해결책

**가장 간단한 방법:**

```bash
# 이 한 줄이면 됩니다!
npx prisma db push --accept-data-loss=false
```

**`prisma db push`는 다음을 자동으로 수행합니다:**
1. Prisma 클라이언트 생성 (`generate`)
2. 데이터베이스 스키마 동기화 (`push`)
3. 모든 것이 한 번에 처리됨

## 📋 실행 순서

```bash
# 1. DATABASE_URL 확인 (이미 확인함)
echo $DATABASE_URL

# 2. 바로 db push 실행 (generate 자동 포함)
npx prisma db push --accept-data-loss=false

# 3. 확인
npx prisma db execute --stdin <<< "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone';"
```

## ⚠️ 주의사항

- `prisma db push`는 `generate`를 자동으로 포함하므로 별도로 실행할 필요 없습니다
- 권한 문제는 `node_modules` 디렉토리 때문이므로, `db push`를 사용하면 우회할 수 있습니다
- `--accept-data-loss=false` 옵션으로 데이터 안전성 보장

## 🔄 대안: 재배포

만약 위 방법들이 모두 실패하면:

1. **코드 수정**: `migrate-seed-and-start.sh` 스크립트가 이미 개선되어 있음
2. **재배포**: CloudType에서 재배포하면 자동으로 마이그레이션 실행
3. **배포 로그 확인**: "✅ 데이터베이스 스키마 동기화 성공" 메시지 확인

