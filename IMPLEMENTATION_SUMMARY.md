# 운세 GPT 연동 구현 요약

## ✅ 완료된 작업

### 1. 운세 데이터 저장 구조
- `FortuneSession` 테이블에 `userInput` (String) 및 `userData` (Json) 필드 추가
- `formType` 필드 추가 (ASK, DAILY, TRADITIONAL)
- Prisma 스키마 업데이트 완료

### 2. AI 모델 교체 가능한 디자인 패턴
- **Strategy Pattern** 적용: `IAIService` 인터페이스 정의
- **Factory Pattern** 적용: `AIServiceFactory`로 AI 서비스 생성
- 현재 OpenAI 구현 완료, 향후 Claude/Gemini 등 추가 가능

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
- 프롬프트를 파일로 분리하여 관리
- `PromptLoader`로 동적 로드

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

### 4. 프론트엔드 요구사항 문서화
- `FRONTEND_REQUIREMENTS.md` 생성
- 카테고리별 필수 정보 정리
- 데이터 전송 형식 및 플로우 설명

## 🔄 진행 중인 작업

### 결과 조회 API에서 GPT 호출
- 결과 조회 시 저장된 결과가 없으면 GPT로 생성
- 생성된 결과는 `DocumentResult`에 저장

## 📝 남은 작업

### 1. 세션 생성 시 userInput/userData 저장
- `CreateFortuneSessionUseCase` 수정
- `FortuneSession` 엔티티에 userInput/userData 추가
- `PrismaFortuneSessionRepository` 수정

### 2. 결과 조회 API 수정
- `getResultByToken`에서 GPT 호출 로직 추가
- 결과가 없으면 GPT로 생성 후 저장
- 로딩 상태 처리

### 3. 카테고리별 프롬프트 추가
- 현재 사주(SAJU)만 구현됨
- 나머지 카테고리 프롬프트 추가 필요

## 🎯 다음 단계

1. **세션 생성 로직 수정**: userInput/userData 저장
2. **결과 조회 API 수정**: GPT 호출 및 결과 저장
3. **프롬프트 추가**: 주요 카테고리 프롬프트 작성
4. **테스트**: 전체 플로우 테스트

## 📚 참고 문서

- `FORTUNE_AI_GUIDE.md`: 프롬프트 작성 가이드
- `FRONTEND_REQUIREMENTS.md`: 프론트엔드 요구사항
- `FORTUNE_API_GUIDE.md`: API 사용 가이드

