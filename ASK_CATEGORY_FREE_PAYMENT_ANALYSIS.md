# ASK 카테고리 무료 결제 정책 분석

## 📋 현재 설정

ASK 카테고리에 `defaultDiscountRate: 100` 설정으로 인해:
- 채팅형: `CHAT_PRICE_PER_MINUTE = 0` + `defaultDiscountRate: 100` → **0원**
- 문서형: `DOCUMENT_PRICES` (예: 5000원) + `defaultDiscountRate: 100` → **0원**

## ⚠️ 발견된 문제점

### 1. **priceCalculator.ts 계산식 오류** (심각)

**현재 코드:**
```typescript
const discountedAmount = baseAmount * (100 - discountRate);
const finalAmount = Math.floor(discountedAmount / 10000) * 100;
```

**문제점:**
- 계산식이 잘못됨: `baseAmount * (100 - discountRate)` 
  - 예: 10000원에 50% 할인 → 10000 * (100 - 50) = **500000원** (잘못됨!)
- 10원 단위 절삭이 100원 단위로 잘못 구현됨: `Math.floor(discountedAmount / 10000) * 100`

**올바른 계산식:**
```typescript
const discountedAmount = baseAmount * (1 - discountRate / 100);
const finalAmount = Math.floor(discountedAmount / 10) * 10;
```

### 2. **0원 결제 처리 문제**

#### 2.1 PaymentService.createPayment
- ✅ 0원도 Order와 Payment 레코드 생성 (문제 없음)
- ⚠️ PortOne 결제는 0원 결제를 처리하지 않을 수 있음

#### 2.2 문서형 결제 필수 정책
- `CreateFortuneSessionUseCase`에서 문서형은 무조건 `paymentId` 필수
- 하지만 0원이면:
  - 실제 PortOne 결제 없이도 Payment 레코드가 생성됨
  - Payment 상태가 `PENDING` → `COMPLETED`로 변경되어야 세션 생성 가능
  - 웹훅이 오지 않으면 영원히 `PENDING` 상태

#### 2.3 웹훅 처리
- `confirmPaymentByWebhook`에서 0원 결제는 PortOne에서 웹훅이 오지 않을 수 있음
- 0원 결제는 자동으로 `COMPLETED` 처리해야 함

### 3. **채팅형 무료 처리**
- 현재는 `useFreeHongsi: true`로 처리
- `defaultDiscountRate: 100`으로 인해 결제 플로우를 타면 0원 결제가 생성됨
- 이는 불필요한 Order/Payment 레코드 생성

## 🔧 해결 방안

### 방안 1: 0원 결제 자동 완료 처리 (권장)

**PrepareFortunePaymentUseCase.ts**
```typescript
// 결제 및 주문 생성
const paymentResult = await this.paymentService.createPayment({
  // ... 기존 코드
});

// 0원 결제는 자동으로 완료 처리
if (product.finalAmount === 0) {
  await this.paymentService.completePayment(paymentResult.paymentId);
  // Payment와 Order 상태를 COMPLETED/PAID로 변경
}
```

**장점:**
- 기존 결제 플로우 유지
- 문서형도 결제 필수 정책 유지
- PortOne 결제 없이도 세션 생성 가능

**단점:**
- 불필요한 Order/Payment 레코드 생성

### 방안 2: 무료 상품은 결제 플로우 우회

**PrepareFortunePaymentUseCase.ts**
```typescript
// 0원 상품은 결제 플로우 우회
if (product.finalAmount === 0) {
  // 결제 없이 바로 세션 생성 가능하도록 처리
  // 또는 특별한 무료 플래그 반환
}
```

**장점:**
- 불필요한 레코드 생성 방지
- 명확한 무료 처리

**단점:**
- 문서형 결제 필수 정책과 충돌
- 코드 분기 복잡도 증가

### 방안 3: priceCalculator.ts 수정 + 0원 자동 완료

1. **priceCalculator.ts 계산식 수정** (필수)
2. **0원 결제 자동 완료 처리** 추가

**장점:**
- 계산식 오류 수정
- 0원 결제 처리 명확화
- 기존 정책 유지

## 📝 권장 사항

1. **즉시 수정 필요:**
   - `priceCalculator.ts` 계산식 수정 (현재 모든 할인 계산이 잘못됨)

2. **0원 결제 처리:**
   - `PrepareFortunePaymentUseCase`에서 0원 결제는 자동으로 `COMPLETED` 처리
   - 또는 `CreateFortuneSessionUseCase`에서 0원 결제는 검증 우회

3. **문서형 정책:**
   - 문서형은 결제 필수이지만, 0원이면 자동 완료 처리
   - 또는 문서형에서도 무료는 결제 플로우 우회 허용

## 🧪 테스트 시나리오

1. **ASK 카테고리 채팅형 (0원)**
   - `useFreeHongsi: true` 사용 (결제 플로우 우회)
   - 또는 결제 플로우 타되 0원 자동 완료

2. **ASK 카테고리 문서형 (0원)**
   - 결제 준비 → 0원 결제 생성 → 자동 완료 → 세션 생성

3. **일반 카테고리 (유료)**
   - 기존 플로우 유지

