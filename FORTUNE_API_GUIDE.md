# 포포춘(For Fortune) 운세 서비스 API 가이드

## 📋 목차
1. [서비스 개요](#서비스-개요)
2. [결제 플로우](#결제-플로우)
3. [API 사용 순서](#api-사용-순서)
4. [결과 페이지 조회 API](#결과-페이지-조회-api)
5. [주요 기능 설명](#주요-기능-설명)
6. [에러 처리](#에러-처리)

---

## 서비스 개요

포포춘은 AI 기반 운세 상담 플랫폼으로, **채팅형**과 **문서형** 두 가지 모드를 제공합니다.

### 서비스 모드
- **채팅형 (CHAT)**: 실시간 대화형 운세 상담 (무료 홍시 2분 제공 또는 일회성 결제)
- **문서형 (DOCUMENT)**: 상세 리포트 생성 (무조건 일회성 결제 필수)

### 운세 카테고리 (12가지)
- SASA (사주), TAROT (타로), DREAM (꿈해몽), LUCKY_NUMBER (행운번호)
- LOVE (연애운), CAREER (직장운), BUSINESS (사업운)
- LUCKY_DAY (길일), MOVING (이사), CAR_PURCHASE (차구매)
- NAMING (작명), NICKNAME (닉네임)

---

## 결제 플로우

### 📌 플로우 다이어그램

```
[사용자]
   │
   ├─ [문서형 리포트]
   │   │
   │   ├─ 1. 상품 정보 조회 (GET /api/v1/fortune/products/:category)
   │   ├─ 2. 결제 준비 (POST /api/v1/fortune/payment/prepare)
   │   ├─ 3. 프론트: PortOne SDK로 결제 창 오픈 (merchantUid 사용)
   │   ├─ 4. PortOne: 결제 완료 → 웹훅으로 백엔드에 알림 (POST /api/v1/fortune/payment/webhook)
   │   ├─ 5. 세션 생성 (POST /api/v1/fortune/session) ← paymentId 필수, formType 필수
   │   └─ 6. 문서 생성 (POST /api/v1/fortune/document)
   │
   └─ [채팅형 상담]
       │
       ├─ [무료 홍시 사용]
       │   │
       │   └─ 1. 세션 생성 (POST /api/v1/fortune/session) ← useFreeHongsi: true, formType 필수
       │
       └─ [일회성 결제]
           │
           ├─ 1. 상품 정보 조회 (GET /api/v1/fortune/products/:category)
           ├─ 2. 결제 준비 (POST /api/v1/fortune/payment/prepare)
           ├─ 3. 프론트: PortOne SDK로 결제 창 오픈 (merchantUid 사용)
           ├─ 4. PortOne: 결제 완료 → 웹훅으로 백엔드에 알림 (POST /api/v1/fortune/payment/webhook)
           ├─ 5. 세션 생성 (POST /api/v1/fortune/session) ← paymentId + durationMinutes(필수) + formType 필수
           └─ 6. 채팅 메시지 전송 (POST /api/v1/fortune/chat)
```

---

## API 사용 순서

### 🎯 시나리오 1: 문서형 리포트 생성 (결제 필수)

#### 1단계: 상품 정보 조회
```http
GET /api/v1/fortune/products/SASA
```

**응답 예시:**
```json
{
  "success": true,
  "data": [
    {
      "type": "DOCUMENT_REPORT",
      "category": "SASA",
      "name": "사주 리포트",
      "amount": 3000,
      "description": "사주 상세 분석 리포트"
    },
    {
      "type": "CHAT_SESSION",
      "category": "SASA",
      "name": "사주 채팅 상담",
      "amount": 5000,
      "description": "사주 전문가와 10분간 실시간 상담",
      "duration": 600
    }
  ]
}
```

#### 2단계: 결제 준비
```http
POST /api/v1/fortune/payment/prepare
Authorization: Bearer {access_token}

{
  "productType": "DOCUMENT_REPORT",
  "category": "SASA"
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_1234567890",
    "paymentId": "payment_1234567890",
    "amount": 10000,
    "productName": "사주팔자",
    "merchantUid": "FORTUNE1723456789123ABCD"
  }
}
```

#### 3단계: 프론트엔드에서 PortOne 결제 창 오픈

**중요**: 결제는 프론트엔드에서 PortOne SDK를 사용하여 진행합니다.

```typescript
// 프론트엔드 예시 (PortOne SDK 사용)
import { PortOne } from '@portone/browser-sdk/v2';

const requestPayment = async (merchantUid: string, amount: number, productName: string) => {
  const response = await PortOne.requestPayment({
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID, // PortOne Store ID
    channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY, // PortOne Channel Key
    paymentId: merchantUid, // 결제 준비에서 받은 merchantUid 사용
    orderName: productName,
    totalAmount: amount,
    currency: 'KRW',
    payMethod: 'CARD',
    customer: {
      // 고객 정보 (선택)
    },
    customData: JSON.stringify({
      orderId: orderId, // 결제 준비에서 받은 orderId
      paymentId: paymentId, // 결제 준비에서 받은 paymentId
    }),
  });

  if (response.code === 'SUCCESS') {
    // 결제 성공 - 웹훅이 자동으로 처리됨
    // 세션 생성 단계로 진행
  } else {
    // 결제 실패 처리
  }
};
```

**참고**: 
- PortOne은 결제 완료 후 자동으로 백엔드 웹훅(`POST /api/v1/fortune/payment/webhook`)을 호출합니다.
- 웹훅 처리 후 결제 상태가 `PAID`로 업데이트되어야 세션 생성이 가능합니다.

#### 4단계: 세션 생성 (결제 ID 포함)

**중요**: 웹훅 처리가 완료된 후에만 세션 생성이 가능합니다.

```http
POST /api/v1/fortune/session
Authorization: Bearer {access_token}

{
  "category": "SASA",
  "formType": "TRADITIONAL",  // 필수! (ASK, DAILY, TRADITIONAL 중 선택)
  "mode": "DOCUMENT",
  "userInput": "1990년 1월 1일 오전 10시에 태어났어요",
  "paymentId": "payment_1234567890"  // 필수! (결제 준비에서 받은 paymentId)
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_clx1234567890",
    "category": "SASA",
    "mode": "DOCUMENT",
    "remainingTime": 0,
    "isActive": true,
    "expiresAt": "2025-11-02T17:45:00.000Z",
    "isPaid": true
  },
  "message": "세션이 생성되었습니다."
}
```

#### 5단계: 문서 리포트 생성
```http
POST /api/v1/fortune/document
Authorization: Bearer {access_token}

{
  "category": "SASA",
  "formType": "TRADITIONAL",  // 필수! (세션 생성 시와 동일한 값)
  "userInput": "1990년 1월 1일 오전 10시에 태어났어요"
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "title": "2025년 당신의 사주 운세",
    "date": "2025-11-02",
    "summary": "당신의 사주는...",
    "content": "상세한 사주 분석 내용...",
    "advice": ["조언 1", "조언 2", "조언 3"],
    "warnings": ["주의사항 1", "주의사항 2"],
    "chatPrompt": "더 자세한 상담을 원하시나요? 홍시를 사용해 채팅으로 이어보세요!"
  }
}
```

#### 6단계: 결과 페이지 조회 (상세 페이지)
```http
GET /api/v1/fortune/result/{resultToken}
```

**설명:**
- 세션 생성 시 응답으로 받은 `resultToken`을 사용하여 결과 페이지를 조회합니다.
- 인증이 필요 없습니다 (토큰 기반 접근).
- 프론트엔드 URL 예시: `http://localhost:3000/fortune/traditional/result/{resultToken}`

**요청 예시:**
```http
GET /api/v1/fortune/result/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "sessionMeta": {
      "sessionId": "session_clx1234567890",
      "category": "SASA",
      "formType": "TRADITIONAL",
      "mode": "DOCUMENT",
      "remainingTime": 0,
      "isPaid": true,
      "expiresAt": "2025-11-02T17:45:00.000Z"
    },
    "document": {
      "id": "doc_clx1234567890",
      "userId": "user_123",
      "category": "SASA",
      "title": "2025년 당신의 사주 운세",
      "content": "상세한 사주 분석 내용...",
      "issuedAt": "2025-11-02T17:40:00.000Z",
      "expiresAt": "2025-12-02T17:40:00.000Z",
      "documentLink": "https://..."
    },
    "lastChats": [],
    "cta": {
      "label": "채팅으로 이어보기(홍시 사용)",
      "requiresPayment": true
    }
  },
  "timestamp": "2025-11-02T17:45:00.000Z"
}
```

**응답 필드 설명:**
- `sessionMeta`: 세션 메타데이터 (세션 ID, 카테고리, 모드, 남은 시간 등)
- `document`: 문서형 결과 (문서형 세션일 경우)
- `lastChats`: 최근 채팅 기록 5개 (채팅형 세션일 경우)
- `cta`: Call-to-Action 정보 (채팅으로 이어가기 버튼 등)

**에러 응답:**
- `401 TOKEN_INVALID`: 토큰이 유효하지 않거나 만료됨

---

### 💬 시나리오 2: 채팅형 상담 (무료 홍시)

#### 1단계: 무료 홍시로 세션 생성
```http
POST /api/v1/fortune/session
Authorization: Bearer {access_token}

{
  "category": "SASA",
  "formType": "ASK",  // 필수! (ASK, DAILY, TRADITIONAL 중 선택)
  "mode": "CHAT",
  "userInput": "사주를 봐주세요",
  "useFreeHongsi": true  // 무료 홍시 사용
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session_clx1234567890",
    "category": "SASA",
    "mode": "CHAT",
    "remainingTime": 120,  // 2분 (120초)
    "isActive": true,
    "expiresAt": "2025-11-02T17:42:00.000Z",
    "isPaid": false
  },
  "remainingTime": 120,
  "isFreeHongsi": true,
  "message": "세션이 생성되었습니다."
}
```

#### 2단계: 채팅 메시지 전송
```http
POST /api/v1/fortune/chat
Authorization: Bearer {access_token}

{
  "sessionId": "session_clx1234567890",
  "message": "연애운이 어떤가요?"
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "summary": "당신의 연애운은...",
    "points": ["포인트 1", "포인트 2", "포인트 3"],
    "tips": ["팁 1", "팁 2"],
    "disclaimer": "모든 운세는 참고용입니다.",
    "suggestPayment": false
  },
  "remainingTime": 115,  // 시간이 소비됨
  "message": "응답이 생성되었습니다."
}
```

#### 3단계: 시간 부족 시 홍시 구매
```http
POST /api/v1/fortune/hongsi/purchase
Authorization: Bearer {access_token}

{
  "unit": "MINUTES_10",
  "sessionId": "session_clx1234567890"  // 선택: 있으면 자동 연장
}
```

---

### 💰 시나리오 3: 채팅형 상담 (일회성 결제)

#### 1단계: 상품 정보 조회
```http
GET /api/v1/fortune/products/DREAM
```

#### 2단계: 결제 준비 (채팅형: durationMinutes 필수)
```http
POST /api/v1/fortune/payment/prepare
Authorization: Bearer {access_token}

{
  "productType": "CHAT_SESSION",
  "category": "DREAM",
  "durationMinutes": 10  // 필수! (5, 10, 30 중 선택)
}
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_chat_12345",
    "paymentId": "payment_chat_12345",
    "amount": 5000,  // 할인 적용된 최종 금액
    "productName": "꿈해몽 채팅 상담 (10분)",
    "merchantUid": "FORTUNECHAT1723456789EFGH"
  }
}
```

#### 3단계: 프론트엔드에서 PortOne 결제 창 오픈

**중요**: 결제는 프론트엔드에서 PortOne SDK를 사용하여 진행합니다.

```typescript
// 프론트엔드 예시 (PortOne SDK 사용)
import { PortOne } from '@portone/browser-sdk/v2';

const requestPayment = async (merchantUid: string, amount: number, productName: string) => {
  const response = await PortOne.requestPayment({
    storeId: process.env.NEXT_PUBLIC_PORTONE_STORE_ID,
    channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY,
    paymentId: merchantUid, // 결제 준비에서 받은 merchantUid 사용
    orderName: productName,
    totalAmount: amount,
    currency: 'KRW',
    payMethod: 'CARD',
    customData: JSON.stringify({
      orderId: orderId,
      paymentId: paymentId,
    }),
  });

  if (response.code === 'SUCCESS') {
    // 결제 성공 - 웹훅이 자동으로 처리됨
    // 세션 생성 단계로 진행
  }
};
```

**참고**: 
- PortOne은 결제 완료 후 자동으로 백엔드 웹훅(`POST /api/v1/fortune/payment/webhook`)을 호출합니다.
- 웹훅 처리 후 결제 상태가 `PAID`로 업데이트되어야 세션 생성이 가능합니다.

#### 4단계: 세션 생성 (결제 ID + 시간 포함)

**중요**: 웹훅 처리가 완료된 후에만 세션 생성이 가능합니다.

```http
POST /api/v1/fortune/session
Authorization: Bearer {access_token}

{
  "category": "DREAM",
  "formType": "ASK",  // 필수! (ASK, DAILY, TRADITIONAL 중 선택)
  "mode": "CHAT",
  "userInput": "꿈해몽 상담 부탁합니다",
  "paymentId": "payment_chat_12345",  // 결제 준비에서 받은 paymentId
  "durationMinutes": 10                 // 필수! (5, 10, 30 중 선택, 결제 준비 시와 동일)
}
```

**응답:**
- `remainingTime`: 600 (10분)
- `isPaid`: true

#### 5단계: 채팅 메시지 전송
```http
POST /api/v1/fortune/chat
Authorization: Bearer {access_token}

{
  "sessionId": "session_chat_abcde",
  "message": "용꿈은 길몽인가요?"
}
```

#### 6단계: 결과 페이지 조회 (상세 페이지)
```http
GET /api/v1/fortune/result/{resultToken}
```

**설명:**
- 세션 생성 시 응답으로 받은 `resultToken`을 사용하여 결과 페이지를 조회합니다.
- 인증이 필요 없습니다 (토큰 기반 접근).
- 프론트엔드 URL 예시: `http://localhost:3000/fortune/dream/result/{resultToken}`

**요청 예시:**
```http
GET /api/v1/fortune/result/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "sessionMeta": {
      "sessionId": "session_chat_abcde",
      "category": "DREAM",
      "formType": "ASK",
      "mode": "CHAT",
      "remainingTime": 580,
      "isPaid": true,
      "expiresAt": "2025-11-02T18:00:00.000Z"
    },
    "document": null,
    "lastChats": [
      {
        "id": "chat_123",
        "sessionId": "session_chat_abcde",
        "userInput": "용꿈은 길몽인가요?",
        "aiOutput": "용꿈은 매우 길몽입니다...",
        "elapsedTime": 20,
        "isPaid": true,
        "createdAt": "2025-11-02T17:50:00.000Z"
      }
    ],
    "cta": {
      "label": "채팅으로 이어보기(홍시 사용)",
      "requiresPayment": false
    }
  },
  "timestamp": "2025-11-02T17:55:00.000Z"
}
```

**응답 필드 설명:**
- `sessionMeta`: 세션 메타데이터 (세션 ID, 카테고리, 모드, 남은 시간 등)
- `document`: 문서형 결과 (문서형 세션일 경우, 채팅형은 null)
- `lastChats`: 최근 채팅 기록 5개 (채팅형 세션일 경우)
- `cta`: Call-to-Action 정보 (채팅으로 이어가기 버튼 등)

**에러 응답:**
- `401 TOKEN_INVALID`: 토큰이 유효하지 않거나 만료됨

---

## 결과 페이지 조회 API

### 📄 결과 페이지 조회 (상세 페이지)

운세 세션의 결과를 조회하는 API입니다. 세션 생성 시 받은 `resultToken`을 사용하여 접근합니다.

#### API 엔드포인트
```http
GET /api/v1/fortune/result/{resultToken}
```

#### 특징
- **인증 불필요**: 토큰 기반 접근으로 별도 인증이 필요 없습니다.
- **토큰 만료**: 토큰은 30분 후 만료됩니다 (기본값).
- **공유 가능**: 토큰을 URL에 포함하여 결과를 공유할 수 있습니다.

#### 사용 시나리오

**1. 문서형 결과 조회**
- 문서 생성 후 결과 페이지에서 문서 내용을 표시합니다.
- `document` 필드에 문서 정보가 포함됩니다.

**2. 채팅형 결과 조회**
- 채팅 세션의 최근 대화 기록을 조회합니다.
- `lastChats` 필드에 최근 5개 채팅이 포함됩니다.

**3. CTA (Call-to-Action)**
- `cta` 필드를 통해 "채팅으로 이어보기" 버튼 표시 여부를 결정합니다.
- `requiresPayment: true`이면 결제가 필요함을 표시합니다.

#### 프론트엔드 URL 구조
```
http://localhost:3000/fortune/{category}/{formType}/result/{resultToken}
```

예시:
- `http://localhost:3000/fortune/traditional/result/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- `http://localhost:3000/fortune/dream/ask/result/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### 요청 예시
```http
GET /api/v1/fortune/result/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzZXNzaW9uSWQiOiJzZXNzaW9uX2NseDEyMzQ1Njc4OTAiLCJ1c2VySWQiOiJ1c2VyXzEyMyIsImNhdGVnb3J5IjoiU0FTQSIsImZvcm1UeXBlIjoiVFJBRElUSU9OQUwiLCJtb2RlIjoiRE9DVU1FTlQifQ...
```

#### 응답 예시 (문서형)
```json
{
  "success": true,
  "data": {
    "sessionMeta": {
      "sessionId": "session_clx1234567890",
      "category": "SASA",
      "formType": "TRADITIONAL",
      "mode": "DOCUMENT",
      "remainingTime": 0,
      "isPaid": true,
      "expiresAt": "2025-11-02T17:45:00.000Z"
    },
    "document": {
      "id": "doc_clx1234567890",
      "userId": "user_123",
      "category": "SASA",
      "title": "2025년 당신의 사주 운세",
      "content": "상세한 사주 분석 내용...",
      "issuedAt": "2025-11-02T17:40:00.000Z",
      "expiresAt": "2025-12-02T17:40:00.000Z",
      "documentLink": "https://..."
    },
    "lastChats": [],
    "cta": {
      "label": "채팅으로 이어보기(홍시 사용)",
      "requiresPayment": true
    }
  },
  "timestamp": "2025-11-02T17:45:00.000Z"
}
```

#### 응답 예시 (채팅형)
```json
{
  "success": true,
  "data": {
    "sessionMeta": {
      "sessionId": "session_chat_abcde",
      "category": "DREAM",
      "formType": "ASK",
      "mode": "CHAT",
      "remainingTime": 580,
      "isPaid": true,
      "expiresAt": "2025-11-02T18:00:00.000Z"
    },
    "document": null,
    "lastChats": [
      {
        "id": "chat_123",
        "sessionId": "session_chat_abcde",
        "userInput": "용꿈은 길몽인가요?",
        "aiOutput": "용꿈은 매우 길몽입니다. 용은 권력과 성공을 상징하며...",
        "elapsedTime": 20,
        "isPaid": true,
        "createdAt": "2025-11-02T17:50:00.000Z"
      }
    ],
    "cta": {
      "label": "채팅으로 이어보기(홍시 사용)",
      "requiresPayment": false
    }
  },
  "timestamp": "2025-11-02T17:55:00.000Z"
}
```

#### 응답 필드 상세 설명

**sessionMeta**
- `sessionId`: 세션 고유 ID
- `category`: 운세 카테고리 (SASA, TAROT, DREAM 등)
- `formType`: 폼 타입 (ASK, DAILY, TRADITIONAL)
- `mode`: 세션 모드 (CHAT, DOCUMENT)
- `remainingTime`: 남은 시간 (초 단위)
- `isPaid`: 결제 여부
- `expiresAt`: 세션 만료 시간

**document** (문서형 세션일 경우)
- `id`: 문서 ID
- `userId`: 사용자 ID
- `category`: 운세 카테고리
- `title`: 문서 제목
- `content`: 문서 내용
- `issuedAt`: 발행일시
- `expiresAt`: 만료일시
- `documentLink`: 문서 링크 (선택)

**lastChats** (채팅형 세션일 경우)
- 최근 5개 채팅 기록 배열
- 각 채팅은 `userInput`, `aiOutput`, `elapsedTime`, `isPaid`, `createdAt` 포함

**cta** (Call-to-Action)
- `label`: 버튼 텍스트
- `requiresPayment`: 결제 필요 여부

#### 에러 응답

**401 TOKEN_INVALID**
```json
{
  "success": false,
  "error": "TOKEN_INVALID"
}
```
- 토큰이 유효하지 않거나 만료됨
- 프론트엔드에서 로그인 페이지로 리다이렉트 권장

---

## 주요 기능 설명

### 1. 세션 관리 시스템

#### 세션 생성 규칙
- **문서형**: `paymentId` 필수 (결제 없으면 에러)
- **채팅형**: 다음 중 하나 선택
  - `paymentId` + `durationMinutes(5/10/30분)`: 일회성 결제
  - `useFreeHongsi: true`: 무료 홍시 (2분, 하루 1회)

#### 시간 관리
- 세션 생성 시 `remainingTime` 설정
- 메시지 전송마다 시간 소비 (응답 생성 시간 + 5초)
- 30초 이하 남으면 자동으로 결제 연장 안내

#### 카테고리 제한
- 한 세션은 하나의 카테고리로 고정
- 다른 카테고리 질문 시 안내 메시지 + 3가지 카테고리 제안

---

### 2. 홍시 시스템

#### 무료 홍시
- **제공**: 로그인 사용자 하루 1회
- **시간**: 2분 (120초)
- **사용 조건**: 채팅형만 가능, `useFreeHongsi: true` 설정

#### 유료 홍시 (시간 구매)
- **단위**: 5분, 10분, 30분
- **가격**: 별도 관리 (추후 설정)
- **누적**: 구매한 시간은 같은 세션에 자동 연장

---

### 3. 결제 시스템

#### 일회성 결제 상품 (최신 정책)
- **채팅형 세션**: 5/10/30분 선택 결제. 대부분 카테고리 무료(홍시 2분)로 시작하며, 유료 세션은 주로 DREAM(꿈해몽; 분당 800원, 10분 8,000원 기준, 38% 할인 적용 시 5,000원).
- **문서형 리포트**: 카테고리별 가격(예: 사주팔자 15,000→10,000, 신년운세 30,000→20,000, 손금 18,000→12,000, 횡재수&금전운 5,000→2,500, 토정비결 15,000→10,000).
- **시간 표기**: 채팅형은 `durationMinutes`를 분으로 전달(5/10/30), 응답 `duration`은 초(300/600/1800).

#### 결제 플로우
1. **상품 정보 조회** → 가격 확인 (`GET /api/v1/fortune/products/:category`)
2. **결제 준비** → 주문/결제 ID 및 `merchantUid` 생성 (`POST /api/v1/fortune/payment/prepare`)
3. **프론트엔드: PortOne SDK로 결제 창 오픈** → `merchantUid` 사용
4. **PortOne: 결제 완료** → 웹훅으로 백엔드에 알림 (`POST /api/v1/fortune/payment/webhook`)
5. **웹훅 처리 완료** → 결제 상태 `PAID`로 업데이트
6. **세션 생성** → `paymentId` 포함하여 생성 (`POST /api/v1/fortune/session`)

#### 상품 가격 관리
- 파일: `backend/src/data/fortuneProducts.ts`
- 직접 수정 가능 (서버 재시작 필요)
- 카테고리별 채팅형 분당가/문서형 originalPrice 및 할인률 설정

### 7. 상품 조회 응답 스키마 (업데이트)

```json
[
  {
    "type": "CHAT_SESSION",
    "category": "DREAM",
    "productId": "prod_CHAT_SESSION_DREAM_10min_xxx",
    "name": "꿈해몽 채팅 상담 (10분)",
    "amount": 8000,
    "discountRate": 38,
    "finalAmount": 5000,
    "description": "꿈해몽 전문가와 10분간 실시간 상담",
    "duration": 600
  },
  {
    "type": "DOCUMENT_REPORT",
    "category": "SASA",
    "productId": "prod_DOCUMENT_REPORT_SASA_xxx",
    "name": "사주팔자",
    "amount": 15000,
    "discountRate": 33,
    "finalAmount": 10000,
    "description": "사주팔자 상세 분석 리포트"
  }
]
```

---

## Enums (프론트 참고용)

```ts
// 운세 카테고리
export enum FortuneCategory {
  SASA = 'SASA',
  TAROT = 'TAROT',
  DREAM = 'DREAM',
  LUCKY_NUMBER = 'LUCKY_NUMBER',
  LOVE = 'LOVE',
  CAREER = 'CAREER',
  BUSINESS = 'BUSINESS',
  LUCKY_DAY = 'LUCKY_DAY',
  MOVING = 'MOVING',
  CAR_PURCHASE = 'CAR_PURCHASE',
  NAMING = 'NAMING',
  NICKNAME = 'NICKNAME',
}

// 세션 모드
export enum SessionMode {
  CHAT = 'CHAT',
  DOCUMENT = 'DOCUMENT',
}

// 상품 타입
export enum FortuneProductType {
  CHAT_SESSION = 'CHAT_SESSION',
  DOCUMENT_REPORT = 'DOCUMENT_REPORT',
}

// 홍시(복채) 단위 (시간 구매)
export enum HongsiUnit {
  FREE = 'FREE',
  MINUTES_5 = 'MINUTES_5',
  MINUTES_10 = 'MINUTES_10',
  MINUTES_30 = 'MINUTES_30',
}

// 채팅형 시간 옵션 (분)
export enum ChatDurationMinutes {
  MINUTES_5 = 5,
  MINUTES_10 = 10,
  MINUTES_30 = 30,
}

// 폼 타입 (베타 기간)
export enum FormType {
  ASK = 'ASK',                // 자유 질문
  DAILY = 'DAILY',            // 오늘의 운세
  TRADITIONAL = 'TRADITIONAL', // 전통 운세 (신년운세, 토정비결 등)
}
```

---

### 4. AI 응답 형식

#### 채팅형 응답
```json
{
  "summary": "핵심 요약 2줄",
  "points": ["포인트 1", "포인트 2", "포인트 3~5개"],
  "tips": ["실천 팁 1", "실천 팁 2~3개"],
  "disclaimer": "면책 문구",
  "suggestPayment": false  // 30초 이하일 때 true
}
```

#### 문서형 응답
```json
{
  "title": "리포트 제목",
  "date": "2025-11-02",
  "summary": "요약 2~3줄",
  "content": "상세 본문",
  "advice": ["조언 1", "조언 2", "조언 3~5개"],
  "warnings": ["주의사항 1", "주의사항 2~3개"],
  "chatPrompt": "채팅형 전환 유도 문구"
}
```

---

### 5. 카테고리별 특화 프롬프트

각 카테고리마다 특화된 AI 프롬프트 적용:
- **사주**: 오행, 용신, 대운 분석
- **타로**: 카드 의미, 조합 해석
- **꿈해몽**: 상징적 의미, 심리적 배경
- **행운번호**: 개인정보 기반 번호 추천
- 기타 카테고리별 맞춤 분석

---

### 6. 통계 기능

```http
GET /api/v1/fortune/statistics
Authorization: Bearer {access_token}
```

**응답:**
```json
{
  "success": true,
  "data": {
    "totalSessions": 10,
    "activeSessions": 2,
    "totalDocuments": 5,
    "totalChats": 50,
    "categoryUsage": {
      "SASA": 5,
      "TAROT": 3,
      "LOVE": 2
    },
    "popularCategories": [
      { "category": "SASA", "count": 5 },
      { "category": "TAROT", "count": 3 }
    ]
  }
}
```

---

## 에러 처리

### 주요 에러 케이스

#### 1. 문서형 결제 누락
```
문서형 리포트는 결제가 필수입니다. (3,000원)
```

#### 2. 무료 홍시 중복 사용
```
오늘 무료 홍시를 이미 사용했습니다.
```

#### 3. 채팅형 옵션 미선택
```
채팅 상담을 시작하려면 결제(5,000원) 또는 무료 홍시를 선택해주세요.
```

#### 4. 시간 부족
```
사용 가능한 시간이 없습니다. 결제를 진행해주세요.
```

#### 5. 카테고리 이탈
```
현재 세션은 "사주" 카테고리로 진행 중입니다.
다른 카테고리 질문은 해당 카테고리로 새 세션을 생성해주세요.
```

---

## 개발된 주요 컴포넌트

### 1. 엔티티 (Entities)
- `FortuneSession`: 운세 세션
- `ConversationLog`: 대화 기록
- `DocumentResult`: 문서 결과
- `PaymentDetail`: 결제 상세

### 2. Repository
- `PrismaFortuneSessionRepository`: 세션 CRUD
- `PrismaConversationLogRepository`: 대화 로그 저장
- `PrismaDocumentResultRepository`: 문서 결과 관리
- `PrismaHongsiCreditRepository`: 홍시 크레딧 관리

### 3. UseCase
- `CreateFortuneSessionUseCase`: 세션 생성 (결제/무료 홍시 처리)
- `ChatFortuneUseCase`: 채팅형 대화 처리
- `DocumentFortuneUseCase`: 문서형 리포트 생성
- `PurchaseHongsiUseCase`: 홍시 구매
- `PrepareFortunePaymentUseCase`: 결제 준비
- `GetFortuneStatisticsUseCase`: 통계 조회

### 4. 서비스
- `FortuneGPTService`: GPT 기반 운세 응답 생성
- `FortuneProductService`: 상품 정보 관리

### 5. 배치 작업
- `CleanupExpiredSessionsUseCase`: 만료 세션 정리 (매시간 30분)

---

## 테스트 예시

### 전체 플로우 테스트 (문서형)

```bash
# 1. 상품 정보 조회
curl http://localhost:3350/api/v1/fortune/products/SASA

# 2. 로그인 (액세스 토큰 받기)
# ... (기존 로그인 API 사용)

# 3. 결제 준비
curl -X POST http://localhost:3350/api/v1/fortune/payment/prepare \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "productType": "DOCUMENT_REPORT",
    "category": "SASA"
  }'

# 4. 프론트엔드에서 PortOne SDK로 결제 진행 (merchantUid 사용)
# 참고: 실제 결제는 프론트엔드에서 PortOne SDK를 사용해야 합니다.

# 5. 웹훅 처리 (PortOne이 자동 호출)
# POST /api/v1/fortune/payment/webhook
# 헤더: x-webhook-secret: {PORTONE_WEBHOOK_SECRET}
# 본문: { "orderId": "...", "paymentId": "...", "amount": 10000, "status": "PAID" }

# 6. 세션 생성 (paymentId 포함, formType 필수)
curl -X POST http://localhost:3350/api/v1/fortune/session \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "SASA",
    "formType": "TRADITIONAL",
    "mode": "DOCUMENT",
    "userInput": "1990년 1월 1일 오전 10시",
    "paymentId": "{결제 준비에서 받은 paymentId}"
  }'

# 7. 문서 생성 (formType 필수)
curl -X POST http://localhost:3350/api/v1/fortune/document \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "SASA",
    "formType": "TRADITIONAL",
    "userInput": "1990년 1월 1일 오전 10시"
  }'
```

---

## 주의사항

1. **API 경로**: 모든 운세 API는 `/api/v1/fortune/` 경로를 사용합니다.
2. **문서형은 무조건 결제 필수**: `paymentId` 없이 세션 생성 불가
3. **무료 홍시는 하루 1회**: 이미 사용 시 에러 반환
4. **카테고리 고정**: 세션 생성 후 카테고리 변경 불가
5. **formType 필수**: 모든 세션 생성 요청에 `formType` (ASK, DAILY, TRADITIONAL) 필수
6. **시간 추적**: 메시지 전송마다 시간 소비, 자동 차감
7. **결제 연동**: 
   - 프론트엔드에서 PortOne SDK를 사용하여 결제 창을 열어야 합니다.
   - `merchantUid`는 결제 준비 응답에서 받은 값을 사용합니다.
   - PortOne이 결제 완료 후 자동으로 웹훅을 호출합니다.
   - 웹훅 처리가 완료된 후에만 세션 생성이 가능합니다.
8. **웹훅 시크릿**: `PORTONE_WEBHOOK_SECRET` 환경변수는 백엔드에만 설정하고, 프론트엔드에 노출하면 안 됩니다.

---

## 참고 링크

- **Swagger 문서**: http://localhost:3350/api-docs
- **상품 가격 수정**: `backend/src/data/fortuneProducts.ts`
- **Prisma 스키마**: `backend/prisma/schema.prisma`
