# 프론트엔드 요구사항

## 📋 운세 데이터 수집

### 1. 세션 생성 시 필요한 데이터

결제 후 상세페이지에서 운세 결과를 생성하기 위해 다음 정보가 필요합니다:

#### 기본 정보 (모든 카테고리)
- `userInput`: 사용자가 입력한 원본 텍스트 (예: "1990년 5월 14일 오전 10시생, 남자")
- `userData`: 구조화된 데이터 (선택사항, 추출 가능한 경우)

#### 카테고리별 필수 정보

| 카테고리 | 필수 정보 | 예시 |
|---------|---------|------|
| SAJU (사주) | 생년월일시, 성별 | "1990-05-14 10:00", "male" |
| NEW_YEAR (신년운세) | 생년월일 | "1990-05-14" |
| TOJEONG (토정비결) | 생년월일 | "1990-05-14" |
| HAND (손금) | 손금 사진 또는 설명 | 이미지 URL 또는 텍스트 설명 |
| DREAM (꿈해몽) | 꿈의 상세 내용 | "용을 타고 하늘을 날았어요" |
| TAROT (타로) | 뽑은 카드 정보 | 카드 이름 배열 |
| COMPATIBILITY (궁합) | 두 사람의 생년월일 | ["1990-05-14", "1992-08-20"] |
| NAMING (작명) | 생년월일시 | "1990-05-14 10:00" |
| LUCKY_NUMBER (행운번호) | 생년월일 또는 이름 | "1990-05-14" 또는 "홍길동" |

### 2. 데이터 전송 형식

#### 세션 생성 요청 (`POST /api/v1/fortune/session`)
```json
{
  "category": "SAJU",
  "formType": "TRADITIONAL",
  "mode": "DOCUMENT",
  "userInput": "1990년 5월 14일 오전 10시생, 남자",
  "userData": {
    "name": "홍길동",
    "birthDate": "1990-05-14",
    "birthTime": "10:00",
    "gender": "male",
    "solarLunar": "solar" // solar 또는 lunar
  },
  "paymentId": "payment_123"
}
```

#### userData 구조 (선택사항)
```typescript
interface UserData {
  name?: string;           // 이름
  birthDate?: string;      // 생년월일 (YYYY-MM-DD)
  birthTime?: string;      // 생시 (HH:mm)
  gender?: 'male' | 'female'; // 성별
  solarLunar?: 'solar' | 'lunar'; // 양력/음력
  // 카테고리별 추가 필드
  dreamContent?: string;   // 꿈해몽: 꿈 내용
  tarotCards?: string[];   // 타로: 카드 이름 배열
  partnerBirthDate?: string; // 궁합: 상대방 생년월일
  handImageUrl?: string;  // 손금: 이미지 URL
}
```

### 3. 결과 조회 API 변경사항

#### 기존
- `GET /api/v1/fortune/result/{resultToken}`: 저장된 결과만 반환

#### 변경 후
- `GET /api/v1/fortune/result/{resultToken}`: 
  - 저장된 결과가 있으면 반환
  - 없으면 GPT로 운세 결과 생성 후 반환 및 저장

#### 응답 형식
```json
{
  "success": true,
  "data": {
    "sessionMeta": {
      "sessionId": "session_123",
      "category": "SAJU",
      "formType": "TRADITIONAL",
      "mode": "DOCUMENT",
      "remainingTime": 0,
      "isPaid": true
    },
    "document": {
      "id": "doc_123",
      "title": "2025년 당신의 사주 운세",
      "date": "2025-01-15",
      "summary": "요약...",
      "content": "상세 내용...",
      "advice": ["조언 1", "조언 2", "조언 3"],
      "warnings": ["주의사항 1", "주의사항 2"],
      "chatPrompt": "더 자세한 상담을 원하시나요? 홍시를 사용해 채팅으로 이어보세요!"
    },
    "lastChats": [],
    "cta": {
      "label": "채팅으로 이어보기(홍시 사용)",
      "requiresPayment": true
    }
  }
}
```

## 🔄 작업 흐름

### 문서형 운세 플로우
1. 사용자가 운세 카테고리 선택
2. **운세 데이터 입력 폼 표시** (카테고리별 필수 정보)
3. 결제 진행
4. 세션 생성 (`POST /api/v1/fortune/session`) - `userInput`, `userData` 포함
5. 결과 페이지로 이동 (`/fortune/{category}/result/{resultToken}`)
6. 결과 조회 API 호출 (`GET /api/v1/fortune/result/{resultToken}`)
   - 첫 호출 시 GPT로 운세 결과 생성 (약 3-5초 소요)
   - 이후 호출 시 저장된 결과 반환
7. 결과 표시 및 "채팅으로 이어보기" CTA 표시

### 채팅형 운세 플로우
1. 사용자가 운세 카테고리 선택
2. **운세 데이터 입력 폼 표시** (카테고리별 필수 정보)
3. 무료 홍시 또는 결제 선택
4. 세션 생성 (`POST /api/v1/fortune/session`) - `userInput`, `userData` 포함
5. 첫 메시지 전송 시 GPT로 초기 운세 분석 제공
6. 이후 대화형 상담 진행

## 📝 구현 체크리스트

### 필수 구현
- [ ] 카테고리별 운세 데이터 입력 폼
- [ ] `userInput` 및 `userData` 수집 및 전송
- [ ] 결과 조회 API 호출 시 로딩 상태 표시 (GPT 생성 중)
- [ ] 결과 표시 UI (문서형/채팅형)
- [ ] "채팅으로 이어보기" CTA 버튼

### 선택 구현
- [ ] 운세 데이터 입력 폼 유효성 검증
- [ ] 생년월일 입력 시 양력/음력 선택
- [ ] 손금 이미지 업로드 (HAND 카테고리)
- [ ] 타로 카드 선택 UI (TAROT 카테고리)
- [ ] 결과 공유 기능

## ⚠️ 주의사항

1. **개인정보 보호**: `userData`에 민감한 정보는 포함하지 않도록 주의
2. **로딩 처리**: GPT 응답 생성은 3-5초 소요되므로 적절한 로딩 UI 필요
3. **에러 처리**: GPT 생성 실패 시 재시도 또는 에러 메시지 표시
4. **결과 캐싱**: 동일한 세션에 대한 결과는 캐시하여 재요청 방지

