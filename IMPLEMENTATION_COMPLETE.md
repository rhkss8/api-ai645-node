# 운세 GPT 연동 구현 완료 요약

## ✅ 완료된 작업

### 1. 운세 데이터 저장 구조
- ✅ `FortuneSession` 테이블에 `userInput` (String) 및 `userData` (Json) 필드 추가
- ✅ `formType` 필드 추가 (ASK, DAILY, TRADITIONAL)
- ✅ Prisma 스키마 업데이트 완료
- ✅ `FortuneSession` 엔티티 수정 완료
- ✅ `PrismaFortuneSessionRepository` 수정 완료
- ✅ `CreateFortuneSessionUseCase` 수정 완료 (userInput/userData 저장)

### 2. AI 모델 교체 가능한 디자인 패턴
- ✅ **Strategy Pattern**: `IAIService` 인터페이스 정의
- ✅ **Factory Pattern**: `AIServiceFactory`로 AI 서비스 생성
- ✅ OpenAI 구현 완료 (`OpenAIService`)
- ✅ 향후 Claude/Gemini 등 추가 가능한 구조

**파일 구조:**
```
backend/src/
├── interfaces/
│   └── IAIService.ts          # AI 서비스 인터페이스
├── services/
│   ├── ai/
│   │   ├── OpenAIService.ts   # OpenAI 구현
│   │   └── AIServiceFactory.ts # 팩토리
│   └── FortuneGPTService.ts   # 레거시 호환 래퍼
```

### 3. 카테고리별 프롬프트 파일 관리
- ✅ 프롬프트를 파일로 분리하여 관리
- ✅ `PromptLoader`로 동적 로드
- ✅ 사주(SAJU) 프롬프트 예시 작성 (채팅형/문서형)

**파일 구조:**
```
backend/src/prompts/
├── chat/
│   └── sasa.prompt.ts         # 사주 채팅형 프롬프트
├── document/
│   └── sasa.prompt.ts         # 사주 문서형 프롬프트
└── PromptLoader.ts            # 프롬프트 로더
```

**새로운 카테고리 프롬프트 추가 방법:**
1. `backend/src/prompts/chat/{category}.prompt.ts` 생성
2. `backend/src/prompts/document/{category}.prompt.ts` 생성
3. `PromptLoader.ts`의 `CHAT_PROMPTS` 및 `DOCUMENT_PROMPTS`에 import 및 추가

### 4. 결과 조회 API에서 GPT 호출
- ✅ `getResultByToken`에서 문서가 없으면 GPT로 생성
- ✅ 생성된 결과는 `DocumentResult`에 저장
- ✅ `userInput` 및 `userData`를 GPT에 전달

### 5. 프론트엔드 요구사항 문서화
- ✅ `FRONTEND_REQUIREMENTS.md` 생성
- ✅ 카테고리별 필수 정보 정리
- ✅ 데이터 전송 형식 및 플로우 설명

## 🔄 주요 변경사항

### API 변경사항

#### 1. 세션 생성 API (`POST /api/v1/fortune/session`)
**요청 본문에 추가:**
```json
{
  "userData": {
    "name": "홍길동",
    "birthDate": "1990-05-14",
    "birthTime": "10:00",
    "gender": "male",
    "solarLunar": "solar"
  }
}
```

#### 2. 결과 조회 API (`GET /api/v1/fortune/result/{token}`)
**동작 변경:**
- 기존: 저장된 결과만 반환
- 변경: 저장된 결과가 없으면 GPT로 생성 후 반환
- GPT 생성 시 약 3-5초 소요 (프론트엔드에서 로딩 처리 필요)

### 데이터베이스 스키마 변경

```prisma
model FortuneSession {
  // ... 기존 필드
  formType      FormType?       // ASK, DAILY, TRADITIONAL
  userInput     String?          // 세션 생성 시 사용자 입력
  userData      Json?            // 구조화된 운세 데이터
}
```

## 📝 다음 단계 (선택사항)

### 1. 카테고리별 프롬프트 추가
현재 사주(SAJU)만 구현됨. 나머지 카테고리 프롬프트 추가:
- NEW_YEAR (신년운세)
- MONEY (횡재수 & 금전운)
- DREAM (꿈해몽)
- TAROT (타로)
- 등등...

### 2. 프론트엔드 구현
- [ ] 카테고리별 운세 데이터 입력 폼
- [ ] `userInput` 및 `userData` 수집 및 전송
- [ ] 결과 조회 API 호출 시 로딩 상태 표시
- [ ] 결과 표시 UI

### 3. 테스트
- [ ] 전체 플로우 테스트 (결제 → 세션 생성 → 결과 조회)
- [ ] GPT 응답 형식 검증
- [ ] 에러 처리 테스트

## 🎯 사용 방법

### 1. 세션 생성 시 userData 전송
```typescript
// 프론트엔드 예시
const response = await fetch('/api/v1/fortune/session', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    category: 'SAJU',
    formType: 'TRADITIONAL',
    mode: 'DOCUMENT',
    userInput: '1990년 5월 14일 오전 10시생, 남자',
    userData: {
      name: '홍길동',
      birthDate: '1990-05-14',
      birthTime: '10:00',
      gender: 'male',
      solarLunar: 'solar',
    },
    paymentId: 'payment_123',
  }),
});
```

### 2. 결과 조회 (GPT 자동 생성)
```typescript
// 프론트엔드 예시
const response = await fetch(`/api/v1/fortune/result/${resultToken}`, {
  method: 'GET',
});

// 첫 호출 시 GPT로 운세 결과 생성 (3-5초 소요)
// 이후 호출 시 저장된 결과 반환
```

## 📚 참고 문서

- `FORTUNE_AI_GUIDE.md`: 프롬프트 작성 가이드
- `FRONTEND_REQUIREMENTS.md`: 프론트엔드 요구사항
- `FORTUNE_API_GUIDE.md`: API 사용 가이드
- `IMPLEMENTATION_SUMMARY.md`: 구현 요약

