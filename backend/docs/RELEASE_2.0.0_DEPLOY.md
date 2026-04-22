# 백엔드 2.0.0 배포 가이드

> **현재 운영:** `1.0.0`  
> **본 문서:** `2.0.0`으로 올릴 때 **반드시 수행할 DB·환경·운영 작업**을 정리합니다.  
> 애플리케이션 `package.json` 버전은 **2.0.0**으로 맞춰 두었습니다.

---

## 1. 요약 체크리스트

배포 순서 권장:

1. [ ] 운영 DB **백업**
2. [ ] 환경 변수 **`OAUTH_TOKEN_ENCRYPTION_KEY`** 설정(값은 아래 생성 방법 참고)
3. [ ] **`npx prisma migrate deploy`** (또는 운영 정책에 맞는 마이그레이션 적용)
4. [ ] 배포 파이프라인에서 **`prisma generate`** 가 빌드/기동 시점에 실행되는지 확인
5. [ ] 애플리케이션 배포 및 스모크 테스트(로그인, 프로필, 채팅 API)
6. [ ] (선택) 소셜 로그인 사용자 **재연동** 안내 — 구버전 토큰 저장 형식 사용자 대상

---

## 2. 데이터베이스 마이그레이션

### 2.1 포함된 마이그레이션

| 마이그레이션 | 내용 |
|--------------|------|
| `20260420120000_add_user_chat_usable_until` | `users.chatUsableUntil` 컬럼 추가 — **계정 단위 채팅 이용 만료 시각**(가입 시 1시간 부여, 1·7·30일 이용권으로 연장) |

### 2.2 운영 적용 명령 (예시)

```bash
cd backend
npx prisma migrate deploy
```

- `1.0.0` DB에는 위 컬럼이 없을 수 있습니다. **`migrate deploy`로만** 스키마를 맞추는 것을 권장합니다.
- 이미 스테이징 등에서 `db push`로 컬럼만 추가된 경우, 해당 마이그레이션 SQL은 `ADD COLUMN IF NOT EXISTS`를 사용하므로 중복 적용 시에도 안전하게 설계되어 있습니다.

### 2.3 기존 사용자 데이터

- **`chatUsableUntil`이 `NULL`인 기존 행:** 비즈니스 로직에서 “이용 가능 시간 없음”으로 처리될 수 있습니다.  
  - 필요 시 **일회성 SQL/스크립트**로 가입 시각 기준 초기값을 넣거나, **다음 로그인/결제 시** 값이 채워지도록 정책을 정합니다.
- 신규 가입·소셜 연동 경로에서는 서버가 `chatUsableUntil`을 설정합니다.

---

## 3. 환경 변수 (필수 추가)

### 3.1 `OAUTH_TOKEN_ENCRYPTION_KEY`

소셜 OAuth **access / refresh 토큰**을 DB에 넣기 위한 **AES-256-GCM** 키입니다. **미설정 시 소셜 로그인 저장 단계에서 오류**가 납니다.

**생성 예시:**

```bash
openssl rand -base64 32
```

- 출력 문자열을 **그대로** `OAUTH_TOKEN_ENCRYPTION_KEY`에 넣습니다 (디코딩 시 **정확히 32바이트**).
- 또는 64자리 hex: `openssl rand -hex 32`

**운영 주의:**

- 키를 **바꾸면** 이미 암호화되어 저장된 토큰은 복호화할 수 없습니다.  
  - 해당 사용자는 **소셜 로그인을 한 번 더** 해야 합니다.
- 키는 **Secrets Manager / CI 비밀** 등에만 보관하고 저장소에 커밋하지 않습니다.

---

## 4. Prisma Client 생성 (`prisma generate`)

`2.0.0` 스키마에는 `User.chatUsableUntil` 등이 포함됩니다. **배포 산출물에 반드시 최신 Client**가 들어가야 합니다.

- Docker 이미지 빌드: `Dockerfile` / `Dockerfile.prod` 등에서 이미 `prisma generate`를 호출하는지 확인합니다.
- 로컬/CI: `npm run build`는 `prisma generate && tsc` 순서로 동작합니다.
- 개발: `npm run dev` 전 **`predev`에서 `prisma generate`**가 실행됩니다.

**증상:** `Unknown field 'chatUsableUntil' for select on model User`  
→ 배포 환경에서 **스키마와 다른 오래된 Client**가 올라간 경우입니다. 이미지/볼륨 재빌드 후 `prisma generate`를 다시 실행합니다.

---

## 5. API·프론트 연동 요약 (2.0.0 기준)

배포 후 프론트/클라이언트가 맞춰야 할 주요 변경은 아래와 같습니다. (상세 스펙은 별도 스펙 문서·Swagger 참고)

- **채팅 BM:** 계정 `chatUsableUntil` 기준. 유료 채팅은 **1 / 7 / 30일**만 (`chatEntitlementDays`). **`durationMinutes` 제거.**
- **프로필 API:** `socialRelinkRequired`, `socialRelinkMessage` — 소셜 재연동 필요 시 안내.
- **소셜 로그인:** 암호화 키 미설정 시 **503** + `OAUTH_ENCRYPTION_UNCONFIGURED` / `OAUTH_ENCRYPTION_INVALID` 등.

---

## 6. 배포 후 스모크 테스트 (권장)

1. 헬스/기동 확인  
2. **소셜 로그인** 1건 (신규·기존)  
3. **프로필 조회** — `socialRelinkRequired` 응답 확인  
4. **채팅 세션 생성 → `/api/v1/fortune/chat`** — `chatUsableUntil` 반영 여부  
5. **채팅 이용권 결제 완료 후** 계정 만료 시각 연장 확인  

---

## 7. 롤백 시 참고

- 애플리케이션만 `1.0.0`으로 되돌릴 경우, DB에 `chatUsableUntil` 컬럼이 남아 있어도 **구버전 코드가 해당 컬럼을 읽지 않으면** 대개 동작에는 문제가 없을 수 있습니다.  
- 다만 **마이그레이션 롤백**은 데이터 정책에 따라 별도 검토가 필요합니다.

---

## 8. 문서·버전 정합성

| 항목 | 값 |
|------|-----|
| 패키지 버전 (`backend/package.json`) | **2.0.0** |
| 운영 중인 이전 릴리스 | **1.0.0** |
| 본 가이드 | **2.0.0 배포 전용** |

추가로 2.0.0에 포함된 기능/스펙 변경이 늘어나면, 이 파일에 **섹션을 덧붙이거나** 체크리스트를 갱신합니다.
