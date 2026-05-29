# 채팅 API 에러 코드 가이드

## 📋 개요

`POST /api/v1/fortune/chat` API에서 발생할 수 있는 에러 코드와 프론트엔드 처리 방법입니다.

## 🔴 에러 응답 형식

```typescript
{
  "success": false,
  "error": "ERROR_CODE",        // 에러 코드
  "message": "에러 메시지",      // 사용자에게 보여줄 메시지
  "data": {                     // 추가 정보 (선택사항)
    "requiresPayment": true,    // 결제 유도 필요 여부
    "remainingTime": 0,         // 남은 시간 (초)
    "expiresAt": "2025-11-22T..." // 만료 시간
  },
  "timestamp": "2025-11-22T..."
}
```

## 📝 에러 코드 목록

### 0. CHAT_ACCOUNT_TIME_EXHAUSTED (400) — **세션 생성** (`POST /api/v1/fortune/session`)

**상황**: 계정의 `chatUsableUntil`이 없거나 이미 만료되어 **채팅 세션을 새로 만들 수 없음** (이용권 구매 전/만료 후).

**응답 예시:**
```json
{
  "success": false,
  "error": "CHAT_ACCOUNT_TIME_EXHAUSTED",
  "message": "채팅 이용 가능 시간이 없습니다. 1일 이용권은 …원부터 구매할 수 있습니다.",
  "data": {
    "requiresPayment": true,
    "suggestedPass": {
      "productType": "CHAT_SESSION",
      "productId": "prod_chat_topup_1d_global",
      "chatEntitlementDays": 1,
      "finalAmountWon": 0
    }
  },
  "timestamp": "2025-11-22T..."
}
```

**프론트엔드 처리:**
- `error === 'CHAT_ACCOUNT_TIME_EXHAUSTED'` 분기 → **채팅 이용권(1·7·30일) 결제/상품 화면**으로 이동
- `data.suggestedPass`로 최저가(1일) 안내·결제 준비 API 파라미터 구성 가능
- `POST /api/v1/fortune/chat` 의 `SESSION_TIME_EXPIRED`와 구분: 여기는 **세션 생성 단계**에서 막힌 경우

---

### 1. SESSION_NOT_FOUND (404)
**상황**: 세션을 찾을 수 없음

**응답 예시:**
```json
{
  "success": false,
  "error": "SESSION_NOT_FOUND",
  "message": "세션을 찾을 수 없습니다.",
  "timestamp": "2025-11-22T..."
}
```

**프론트엔드 처리:**
- 세션 생성 페이지로 리다이렉트
- 새 세션 생성 안내

---

### 2. SESSION_TIME_EXPIRED (400)
**상황**: 세션 시간 만료 (결제 유도 필요)

**응답 예시:**
```json
{
  "success": false,
  "error": "SESSION_TIME_EXPIRED",
  "message": "세션 시간이 만료되었습니다. 상담권을 구매하여 상담을 계속하세요.",
  "data": {
    "requiresPayment": true,
    "remainingTime": 0,
    "expiresAt": "2025-11-22T16:00:00.000Z",
    "productType": "CHAT"
  },
  "timestamp": "2025-11-22T..."
}
```

**프론트엔드 처리:**
- ✅ **결제 유도**: 상담권 구매 모달/페이지로 이동 (채팅 세션의 경우)
- ✅ **결제 유도**: 운세리포트 구매 모달/페이지로 이동 (문서 세션의 경우)
- 결제 완료 후 세션 연장 또는 새 세션 생성

---

### 3. SESSION_EXPIRED (400)
**상황**: 세션이 비활성화됨 (시간 만료 외의 이유)

**응답 예시:**
```json
{
  "success": false,
  "error": "SESSION_EXPIRED",
  "message": "세션이 종료되었습니다.",
  "data": {
    "requiresPayment": false
  },
  "timestamp": "2025-11-22T..."
}
```

**프론트엔드 처리:**
- 새 세션 생성 안내
- 세션 생성 페이지로 이동

---

### 4. AUTH_REQUIRED (401)
**상황**: 로그인 필요

**응답 예시:**
```json
{
  "success": false,
  "error": "AUTH_REQUIRED",
  "message": "로그인이 필요합니다.",
  "timestamp": "2025-11-22T..."
}
```

**프론트엔드 처리:**
- 로그인 페이지로 리다이렉트
- 로그인 후 원래 페이지로 복귀

---

### 5. INVALID_REQUEST (400)
**상황**: 잘못된 요청 (sessionId 또는 message 누락)

**응답 예시:**
```json
{
  "success": false,
  "error": "INVALID_REQUEST",
  "message": "세션 ID와 메시지는 필수입니다.",
  "data": {
    "required": ["sessionId", "message"]
  },
  "timestamp": "2025-11-22T..."
}
```

**프론트엔드 처리:**
- 입력 필드 검증 강화
- 사용자에게 필수 필드 안내

---

### 6. AI_QUOTA_EXCEEDED (429)
**상황**: AI 서비스 할당량 초과

**응답 예시:**
```json
{
  "success": false,
  "error": "AI_QUOTA_EXCEEDED",
  "message": "AI 서비스 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.",
  "data": {
    "requiresPayment": false,
    "retryAfter": 60
  },
  "timestamp": "2025-11-22T..."
}
```

**프론트엔드 처리:**
- 재시도 안내 메시지 표시
- `retryAfter` 초 후 자동 재시도 버튼 표시
- 사용자에게 잠시 후 다시 시도하도록 안내

---

### 7. AI_GENERATION_FAILED (500)
**상황**: AI 응답 생성 실패

**응답 예시:**
```json
{
  "success": false,
  "error": "AI_GENERATION_FAILED",
  "message": "운세 응답 생성에 실패했습니다. 잠시 후 다시 시도해주세요.",
  "data": {
    "requiresPayment": false
  },
  "timestamp": "2025-11-22T..."
}
```

**프론트엔드 처리:**
- 재시도 버튼 표시
- 사용자에게 잠시 후 다시 시도하도록 안내

---

## 🎯 프론트엔드 처리 예시

### TypeScript 타입 정의
```typescript
interface ChatErrorResponse {
  success: false;
  error: 
    | 'SESSION_NOT_FOUND'
    | 'SESSION_TIME_EXPIRED'
    | 'SESSION_EXPIRED'
    | 'AUTH_REQUIRED'
    | 'INVALID_REQUEST'
    | 'AI_QUOTA_EXCEEDED'
    | 'AI_GENERATION_FAILED';
  message: string;
  data?: {
    requiresPayment?: boolean;
    remainingTime?: number;
    expiresAt?: string;
    productType?: 'CHAT' | 'DOCUMENT'; // 상품 타입 (채팅: 상담권, 문서: 운세리포트)
    retryAfter?: number;
    required?: string[];
  };
  timestamp: string;
}
```

### 에러 처리 함수
```typescript
async function handleChatError(error: ChatErrorResponse) {
  switch (error.error) {
    case 'SESSION_TIME_EXPIRED':
      // 결제 유도 (상품 타입에 따라 다르게 처리)
      if (error.data?.requiresPayment) {
        const productType = error.data?.productType || 'CHAT'; // 기본값: CHAT
        if (productType === 'CHAT') {
          // 채팅 세션: 상담권 구매
          router.push('/fortune/purchase?sessionId=' + sessionId + '&type=chat');
        } else if (productType === 'DOCUMENT') {
          // 문서 세션: 운세리포트 구매
          router.push('/fortune/purchase?sessionId=' + sessionId + '&type=document');
        }
        // 또는 결제 모달 열기
        openPaymentModal(productType);
      }
      break;
      
    case 'SESSION_NOT_FOUND':
    case 'SESSION_EXPIRED':
      // 새 세션 생성 안내
      router.push('/fortune/new-session');
      break;
      
    case 'AUTH_REQUIRED':
      // 로그인 페이지로 이동
      router.push('/auth/login?redirect=/fortune/chat');
      break;
      
    case 'AI_QUOTA_EXCEEDED':
      // 재시도 안내 (retryAfter 초 후)
      const retryAfter = error.data?.retryAfter || 60;
      showRetryModal(retryAfter);
      break;
      
    case 'AI_GENERATION_FAILED':
      // 재시도 버튼 표시
      showRetryButton();
      break;
      
    case 'INVALID_REQUEST':
      // 입력 필드 에러 표시
      showValidationError(error.data?.required || []);
      break;
      
    default:
      // 일반 에러 처리
      showErrorMessage(error.message);
  }
}
```

## 📌 주요 포인트

1. **SESSION_TIME_EXPIRED**: `requiresPayment: true`일 때 결제 유도
2. **SESSION_NOT_FOUND / SESSION_EXPIRED**: 새 세션 생성 안내
3. **AI_QUOTA_EXCEEDED**: 재시도 가능 시간 안내
4. **AI_GENERATION_FAILED**: 재시도 버튼 제공

