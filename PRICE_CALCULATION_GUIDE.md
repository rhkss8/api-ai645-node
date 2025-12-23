# 결제 가격 계산 가이드

## 📋 개요

프론트엔드와 백엔드에서 동일한 가격 계산식을 사용하기 위한 유틸리티입니다.

## 🔧 사용 방법

### 백엔드 (TypeScript)

```typescript
import { calculateFinalAmount } from './utils/priceCalculator';

// 원래 가격과 할인율로 최종 금액 계산
const baseAmount = 15000; // 원래 가격
const discountRate = 33;  // 할인율 (33%)

const finalAmount = calculateFinalAmount(baseAmount, discountRate);
// 결과: 10050원 (10원 단위 절삭)
```

### 프론트엔드 (JavaScript/TypeScript)

#### 방법 1: 직접 구현 (백엔드와 동일한 로직)

```javascript
/**
 * 할인율을 적용한 최종 결제 금액 계산 (10원 단위 절삭)
 * 
 * @param {number} baseAmount - 원래 가격 (원)
 * @param {number} discountRate - 할인율 (0~100, 예: 33 = 33% 할인)
 * @returns {number} 최종 결제 금액 (10원 단위로 절삭된 금액)
 */
function calculateFinalAmount(baseAmount, discountRate) {
  // 할인 적용 후 금액 계산
  const discountedAmount = baseAmount * (1 - discountRate / 100);
  
  // 10원 단위로 절삭 (내림)
  const finalAmount = Math.floor(discountedAmount / 10) * 10;
  
  return finalAmount;
}

// 사용 예시
const baseAmount = 15000;
const discountRate = 33;
const finalAmount = calculateFinalAmount(baseAmount, discountRate);
console.log(finalAmount); // 10050
```

#### 방법 2: 백엔드 API에서 받은 값 사용

백엔드 API (`GET /api/v1/fortune/products/:category`)에서 이미 계산된 `finalAmount`를 사용하는 것을 권장합니다.

```typescript
// API 응답 예시
{
  "productId": "prod_...",
  "amount": 15000,        // 원래 가격
  "discountRate": 33,     // 할인율
  "finalAmount": 10050    // 최종 결제 금액 (10원 단위 절삭)
}
```

## 📊 계산 예시

### 예시 1: 15000원에 33% 할인

```javascript
baseAmount = 15000
discountRate = 33
discountedAmount = 15000 * (1 - 33/100) = 15000 * 0.67 = 10050
finalAmount = Math.floor(10050 / 10) * 10 = 10050원 ✅
```

### 예시 2: 15000원에 33% 할인 (소수점 발생)

```javascript
baseAmount = 15000
discountRate = 33.333...
discountedAmount = 15000 * (1 - 33.333/100) = 15000 * 0.66667 = 10000.05
finalAmount = Math.floor(10000.05 / 10) * 10 = 10000원 ✅
```

### 예시 3: 20000원에 25% 할인

```javascript
baseAmount = 20000
discountRate = 25
discountedAmount = 20000 * (1 - 25/100) = 20000 * 0.75 = 15000
finalAmount = Math.floor(15000 / 10) * 10 = 15000원 ✅
```

## 🔍 계산 규칙

1. **할인 적용**: `baseAmount * (1 - discountRate / 100)`
2. **10원 단위 절삭**: `Math.floor(할인금액 / 10) * 10`
3. **항상 내림 처리**: 반올림이 아닌 절삭(내림) 처리

## 📁 파일 위치

- **백엔드**: `backend/src/utils/priceCalculator.ts`
- **프론트엔드**: 동일한 로직을 구현하거나 API 응답의 `finalAmount` 사용

## ⚠️ 주의사항

1. **할인율 범위**: 0~100 사이의 값만 유효
2. **10원 단위**: 항상 10원 단위로 절삭되므로 1원 단위는 없음
3. **음수 방지**: 계산 결과가 음수가 되지 않도록 주의

## 🧪 테스트

```javascript
// 테스트 케이스
console.assert(calculateFinalAmount(15000, 33) === 10050, '15000원 33% 할인');
console.assert(calculateFinalAmount(20000, 25) === 15000, '20000원 25% 할인');
console.assert(calculateFinalAmount(10000, 0) === 10000, '할인 없음');
console.assert(calculateFinalAmount(10000, 100) === 0, '100% 할인');
```

