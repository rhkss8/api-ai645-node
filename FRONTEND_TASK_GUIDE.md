# 🚀 프론트엔드 작업지시서: 새로운 유료 추천 플로우

## 📋 개요

유료 추천 번호 생성 플로우가 변경되었습니다. 기존의 "결제 → 추천번호 생성" 방식에서 "파라미터 저장 → 결제 → 추천번호 생성" 방식으로 개선되어 안정성과 사용자 경험이 향상되었습니다.

## 🔄 플로우 변경사항

### 🆓 **무료 추천** (변경 없음)
```
사용자 입력 → 즉시 API 호출 → 추천번호 표시
```

### 💰 **유료 추천** (새로운 플로우)
```
1. 사용자 입력 수집
2. 파라미터 저장 API 호출
3. 결제 정보 생성
4. 결제 진행
5. 결제 완료 후 추천번호 생성 API 호출
6. 추천번호 표시
```

## 🛠️ 구현 가이드

### 1️⃣ **Step 1: 추천 파라미터 저장**

#### API 엔드포인트
```typescript
POST /api/recommend/prepare
```

#### 요청 데이터
```typescript
interface PrepareRecommendationRequest {
  type: 'PREMIUM';
  gameCount?: number; // 1-10, 기본값: 5
  round?: number; // 1-9999, 없으면 자동 설정
  conditions?: {
    excludeNumbers?: number[]; // 제외할 번호 (최대 20개)
    includeNumbers?: number[]; // 포함할 번호 (최대 6개)
    preferences?: string; // 사용자 선호사항
  };
  imageData?: {
    numbers: number[][]; // 이미지에서 추출된 번호들
    extractedText?: string;
    notes?: string;
  };
}
```

#### 응답 데이터
```typescript
interface PrepareRecommendationResponse {
  success: true;
  data: {
    paramId: string; // 파라미터 ID - 결제 시 사용
    type: 'PREMIUM';
    gameCount: number;
    expiresAt: string; // ISO 날짜 - 24시간 후 만료
  };
  message: string;
}
```

#### 구현 예시
```typescript
const prepareRecommendation = async (formData: RecommendationFormData) => {
  try {
    const response = await fetch('/api/recommend/prepare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        type: 'PREMIUM',
        gameCount: formData.gameCount,
        round: formData.round,
        conditions: formData.conditions,
        imageData: formData.imageData,
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      // paramId를 저장하고 결제 단계로 진행
      setParamId(result.data.paramId);
      setExpiresAt(new Date(result.data.expiresAt));
      goToPaymentStep();
    }
  } catch (error) {
    console.error('파라미터 저장 실패:', error);
  }
};
```

### 2️⃣ **Step 2: 결제 주문 생성**

#### API 엔드포인트
```typescript
POST /api/payment/order-register
```

#### 요청 데이터 (수정됨)
```typescript
interface CreateOrderRequest {
  amount: number;
  paramId: string; // ✅ 새로 추가된 필드
  currency?: string; // 기본값: 'KRW'
  description?: string;
  metadata?: any;
}
```

#### 구현 예시
```typescript
const createOrder = async (paramId: string, amount: number) => {
  try {
    const response = await fetch('/api/payment/order-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        amount,
        paramId, // 파라미터 ID 포함
        description: '로또 프리미엄 추천 서비스',
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      const { orderId, merchantUid } = result.data;
      // PortOne 결제 진행
      await processPayment(orderId, merchantUid, amount);
    }
  } catch (error) {
    console.error('주문 생성 실패:', error);
  }
};
```

### 3️⃣ **Step 3: 결제 완료 후 추천번호 생성**

#### API 엔드포인트
```typescript
POST /api/recommend/generate-from-order/{orderId}
```

#### 응답 데이터
```typescript
interface GenerateFromOrderResponse {
  success: true;
  data: {
    gameCount: number;
    numbers: number[][]; // 추천번호 세트들
    round?: number; // 대상 회차
    analysis?: string; // GPT 분석 결과
  };
  message: string;
}
```

#### 구현 예시
```typescript
const generateRecommendationFromOrder = async (orderId: string) => {
  try {
    const response = await fetch(`/api/recommend/generate-from-order/${orderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();
    
    if (result.success) {
      // 추천번호 표시
      setRecommendationNumbers(result.data.numbers);
      setAnalysis(result.data.analysis);
      setTargetRound(result.data.round);
      showRecommendationResult();
    }
  } catch (error) {
    console.error('추천번호 생성 실패:', error);
    // 재시도 버튼 제공
    showRetryOption();
  }
};
```

### 4️⃣ **Step 4: 추천번호 재생성 (실패 시)**

#### API 엔드포인트
```typescript
POST /api/recommend/regenerate/{orderId}
```

#### 구현 예시
```typescript
const regenerateRecommendation = async (orderId: string) => {
  try {
    setIsRegenerating(true);
    
    const response = await fetch(`/api/recommend/regenerate/${orderId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const result = await response.json();
    
    if (result.success) {
      setRecommendationNumbers(result.data.numbers);
      setAnalysis(result.data.analysis);
      showSuccessMessage('추천번호가 재생성되었습니다.');
    }
  } catch (error) {
    console.error('재생성 실패:', error);
    showErrorMessage('재생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
  } finally {
    setIsRegenerating(false);
  }
};
```

## 🎨 UI/UX 가이드

### 📱 **화면 플로우**

#### 1. 유료 추천 설정 화면
```
[게임수 선택] [조건 설정] [이미지 업로드]
           ↓
      [확인 버튼] → 파라미터 저장 API 호출
```

#### 2. 결제 대기 화면
```
[저장된 설정 확인]
[결제 금액 표시]
[결제하기 버튼] → 주문 생성 → PortOne 결제
```

#### 3. 결제 완료 화면
```
[결제 완료 메시지]
[추천번호 생성 중...] → 생성 API 호출
          ↓
     [추천번호 표시]
```

#### 4. 오류 처리 화면
```
[오류 메시지]
[다시 시도 버튼] → 재생성 API 호출
[고객센터 문의 버튼]
```

### 🕒 **타이머 표시**

파라미터는 24시간 후 만료되므로 타이머를 표시해주세요:

```typescript
const ExpirationTimer = ({ expiresAt }: { expiresAt: Date }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft('만료됨');
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}시간 ${minutes}분 남음`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <div className="expiration-timer">
      ⏰ 결제 가능 시간: {timeLeft}
    </div>
  );
};
```

## ⚠️ 에러 처리

### 주요 에러 케이스

1. **파라미터 만료**: 24시간 후 만료시 새로 생성 필요
2. **결제 실패**: 파라미터는 유지, 결제만 재시도
3. **추천번호 생성 실패**: 재생성 버튼 제공
4. **네트워크 오류**: 재시도 로직 구현

### 에러 처리 예시

```typescript
const handleApiError = (error: any, context: string) => {
  if (error.status === 401) {
    // 인증 만료
    redirectToLogin();
  } else if (error.status === 404) {
    if (context === 'order') {
      showError('주문을 찾을 수 없습니다.');
    }
  } else if (error.status === 400) {
    if (error.message?.includes('만료')) {
      showError('파라미터가 만료되었습니다. 다시 설정해주세요.');
      goToSettingsStep();
    }
  } else {
    showError('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
  }
};
```

## 🧪 테스트 가이드

### 테스트 시나리오

1. **정상 플로우**: 설정 → 결제 → 추천번호 생성
2. **결제 실패**: 설정 → 결제 실패 → 재결제
3. **생성 실패**: 결제 완료 → 생성 실패 → 재생성
4. **파라미터 만료**: 24시간 후 결제 시도
5. **네트워크 오류**: 각 단계별 네트워크 오류

### Mock 데이터

```typescript
// 개발용 Mock API
const mockApiCalls = {
  prepare: () => ({
    success: true,
    data: {
      paramId: 'param_test_123',
      type: 'PREMIUM',
      gameCount: 5,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  }),
  
  generateFromOrder: () => ({
    success: true,
    data: {
      gameCount: 5,
      numbers: [[1, 2, 3, 4, 5, 6], [7, 8, 9, 10, 11, 12]],
      round: 1183,
      analysis: 'AI 분석 결과...',
    },
  }),
};
```

## 📚 추가 참고사항

1. **Swagger 문서**: `http://localhost:3350/api-docs`에서 최신 API 스펙 확인
2. **로그 모니터링**: 각 단계별 로그 확인으로 디버깅
3. **사용자 피드백**: 각 단계별 적절한 로딩/완료 메시지 표시
4. **접근성**: 시각적/청각적 피드백 제공

---

## 🔍 체크리스트

- [ ] 파라미터 저장 API 연동
- [ ] 결제 주문 생성에 paramId 추가
- [ ] 결제 완료 후 추천번호 생성 API 연동
- [ ] 재생성 기능 구현
- [ ] 만료 타이머 표시
- [ ] 에러 처리 및 재시도 로직
- [ ] 로딩 상태 관리
- [ ] 사용자 피드백 메시지
- [ ] 전체 플로우 테스트

이 가이드를 따라 구현하시면 안정적이고 사용자 친화적인 유료 추천 플로우를 완성할 수 있습니다! 🚀 