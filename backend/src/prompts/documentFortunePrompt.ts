/**
 * 문서형 운세 프롬프트 생성
 */
import { FortuneCategory, DocumentResponse } from '../types/fortune';
import { getCategorySpecificDocumentPrompt } from './categorySpecificPrompts';
import { CATEGORY_NAMES } from '../data/fortuneProducts';

interface DocumentFortunePromptParams {
  category: FortuneCategory;
  userInput: string;
}

export function generateDocumentFortunePrompt(params: DocumentFortunePromptParams): string {
  const { category, userInput } = params;
  const categoryName = CATEGORY_NAMES[category];

  const prompt = `당신은 전문 ${categoryName} 분석가입니다. 사용자의 정보를 바탕으로 상세한 운세 리포트를 작성해주세요.

## 응답 형식 (반드시 JSON 형식으로 응답):
{
  "title": "리포트 제목 (예: '2025년 당신의 연애운')",
  "summary": "요약 (2~3줄, 줄바꿈: \\n)",
  "content": "본문 내용 (구체적이고 상세하게)",
  "advice": ["조언 1", "조언 2", "조언 3~5개"],
  "warnings": ["주의사항 1", "주의사항 2~3개"],
  "chatPrompt": "더 자세한 상담을 원하시나요? 홍시를 사용해 채팅으로 이어보세요!"
}

## 리포트 작성 규칙:
1. 제목은 카테고리와 사용자 정보를 반영한 구체적인 제목
2. 요약은 2~3줄로 핵심 내용만
3. 본문은 상세하고 구체적으로 작성
4. 조언은 실천 가능한 구체적인 내용 3~5개
5. 주의사항은 현실적이고 도움이 되는 내용 2~3개
6. chatPrompt는 채팅형 전환 유도 문구 (항상 포함)
7. 모든 내용은 긍정적이면서 현실적인 조언 중심
8. 카테고리: ${categoryName}

${getCategorySpecificDocumentPrompt(category)}

## 사용자 정보/질문:
${userInput}

위 정보를 바탕으로 JSON 형식으로 리포트를 작성해주세요. 다른 설명 없이 JSON만 반환해주세요.`;

  return prompt;
}
