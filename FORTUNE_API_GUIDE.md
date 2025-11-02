# 포포춘(For Fortune) 운세 서비스 API 가이드

## 📋 목차
1. [서비스 개요](#서비스-개요)
2. [결제 플로우](#결제-플로우)
3. [API 사용 순서](#api-사용-순서)
4. [주요 기능 설명](#주요-기능-설명)
5. [에러 처리](#에러-처리)

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
   │   ├─ 1. 상품 정보 조회 (GET /api/fortune/products/:category)
   │   ├─ 2. 결제 준비 (POST /api/fortune/payment/prepare)
   │   ├─ 3. 실제 결제 진행 (PortOne 등 외부 결제)
   │   ├─ 4. 세션 생성 (POST /api/fortune/session) ← paymentId 필수
   │   └─ 5. 문서 생성 (POST /api/fortune/document)
   │
   └─ [채팅형 상담]
       │
       ├─ [무료 홍시 사용]
       │   │
       │   └─ 1. 세션 생성 (POST /api/fortune/session) ← useFreeHongsi: true
       │
       └─ [일회성 결제]
           │
           ├─ 1. 상품 정보 조회 (GET /api/fortune/products/:category)
           ├─ 2. 결제 준비 (POST /api/fortune/payment/prepare)
           ├─ 3. 실제 결제 진행 (PortOne 등 외부 결제)
           ├─ 4. 세션 생성 (POST /api/fortune/session) ← paymentId 포함
           └─ 5. 채팅 메시지 전송 (POST /api/fortune/chat)
```

---

## API 사용 순서

### 🎯 시나리오 1: 문서형 리포트 생성 (결제 필수)

#### 1단계: 상품 정보 조회
```http
GET /api/fortune/products/SASA
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
POST /api/fortune/payment/prepare
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
    "amount": 3000,
    "productName": "사주 리포트",
    "merchantUid": "fortune_1234567890_abc123"
  }
}
```

#### 3단계: 실제 결제 진행
- **PortOne** 또는 다른 결제 서비스에서 `paymentId`를 사용하여 결제 진행
- 결제 완료 후 `paymentId`와 결제 상태를 받음

#### 4단계: 세션 생성 (결제 ID 포함)
```http
POST /api/fortune/session
Authorization: Bearer {access_token}

{
  "category": "SASA",
  "mode": "DOCUMENT",
  "userInput": "1990년 1월 1일 오전 10시에 태어났어요",
  "paymentId": "payment_1234567890"  // 필수!
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
POST /api/fortune/document
Authorization: Bearer {access_token}

{
  "category": "SASA",
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

---

### 💬 시나리오 2: 채팅형 상담 (무료 홍시)

#### 1단계: 무료 홍시로 세션 생성
```http
POST /api/fortune/session
Authorization: Bearer {access_token}

{
  "category": "SASA",
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
POST /api/fortune/chat
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
POST /api/fortune/hongsi/purchase
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
GET /api/fortune/products/SASA
```

#### 2단계: 결제 준비
```http
POST /api/fortune/payment/prepare
Authorization: Bearer {access_token}

{
  "productType": "CHAT_SESSION",
  "category": "SASA"
}
```

#### 3단계: 실제 결제 진행
- PortOne 등에서 결제 완료

#### 4단계: 세션 생성 (결제 ID 포함)
```http
POST /api/fortune/session
Authorization: Bearer {access_token}

{
  "category": "SASA",
  "mode": "CHAT",
  "userInput": "사주를 봐주세요",
  "paymentId": "payment_1234567890"  // 결제 ID
}
```

**응답:**
- `remainingTime`: 600 (10분)
- `isPaid`: true

#### 5단계: 채팅 메시지 전송
```http
POST /api/fortune/chat
...
```

---

## 주요 기능 설명

### 1. 세션 관리 시스템

#### 세션 생성 규칙
- **문서형**: `paymentId` 필수 (결제 없으면 에러)
- **채팅형**: 다음 중 하나 선택
  - `paymentId`: 일회성 결제 (10분)
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

#### 일회성 결제 상품
- **채팅형 세션**: 카테고리별 가격 (3,000원~7,000원)
- **문서형 리포트**: 카테고리별 가격 (2,000원~5,000원)
- **기본 시간**: 채팅형 10분 (600초)

#### 결제 플로우
1. 상품 정보 조회 → 가격 확인
2. 결제 준비 → 주문/결제 ID 생성
3. 외부 결제 진행 → PortOne 등
4. 세션 생성 → `paymentId` 포함하여 생성

#### 상품 가격 관리
- 파일: `backend/src/data/fortuneProducts.ts`
- 직접 수정 가능 (서버 재시작 필요)
- 카테고리별 채팅형/문서형 가격 설정

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
GET /api/fortune/statistics
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
curl http://localhost:3350/api/fortune/products/SASA

# 2. 로그인 (액세스 토큰 받기)
# ... (기존 로그인 API 사용)

# 3. 결제 준비
curl -X POST http://localhost:3350/api/fortune/payment/prepare \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "productType": "DOCUMENT_REPORT",
    "category": "SASA"
  }'

# 4. 세션 생성 (paymentId 포함)
curl -X POST http://localhost:3350/api/fortune/session \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "SASA",
    "mode": "DOCUMENT",
    "userInput": "1990년 1월 1일 오전 10시",
    "paymentId": "{결제 준비에서 받은 paymentId}"
  }'

# 5. 문서 생성
curl -X POST http://localhost:3350/api/fortune/document \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "SASA",
    "userInput": "1990년 1월 1일 오전 10시"
  }'
```

---

## 주의사항

1. **문서형은 무조건 결제 필수**: `paymentId` 없이 세션 생성 불가
2. **무료 홍시는 하루 1회**: 이미 사용 시 에러 반환
3. **카테고리 고정**: 세션 생성 후 카테고리 변경 불가
4. **시간 추적**: 메시지 전송마다 시간 소비, 자동 차감
5. **결제 연동**: 실제 결제는 PortOne 등 외부 서비스 필요

---

## 참고 링크

- **Swagger 문서**: http://localhost:3350/api-docs
- **상품 가격 수정**: `backend/src/data/fortuneProducts.ts`
- **Prisma 스키마**: `backend/prisma/schema.prisma`
