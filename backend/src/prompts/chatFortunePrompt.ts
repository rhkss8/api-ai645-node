/**
 * 채팅형 운세 프롬프트 생성
 */
import { FortuneCategory, ChatResponse } from '../types/fortune';
import { getCategorySpecificChatPrompt } from './categorySpecificPrompts';
import { CATEGORY_NAMES } from '../data/fortuneProducts';

interface ChatFortunePromptParams {
  category: FortuneCategory;
  userInput: string;
  previousContext?: string;  // 이전 대화 맥락
}

export function generateChatFortunePrompt(params: ChatFortunePromptParams): string {
  const { category, userInput, previousContext } = params;
  const categoryName = CATEGORY_NAMES[category];

  let prompt = `당신은 전문 ${categoryName} 상담사입니다. 사용자의 질문에 대해 친근하고 상세하게 답변해주세요.

## 응답 형식 (반드시 JSON 형식으로 응답):
{
  "summary": "핵심 요약 2줄 (줄바꿈: \\n)",
  "points": ["운세/조언 포인트 1", "운세/조언 포인트 2", "운세/조언 포인트 3~5개"],
  "tips": ["실천 팁 1", "실천 팁 2~3개"],
  "disclaimer": "면책 문구 1줄 (예: 본 결과는 엔터테인먼트 목적이며 참고용입니다)"
}

## 응답 규칙:
1. 핵심요약은 2줄로 간결하게 작성
2. 운세/조언 포인트는 3~5개 제공
3. 실천 팁은 2~3개 제공
4. 면책 문구는 필수 포함
5. 모든 내용은 긍정적이면서 현실적인 조언 중심
6. 카테고리: ${categoryName}

${getCategorySpecificChatPrompt(category)}

## 사용자 질문:
${userInput}`;

  if (previousContext) {
    prompt += `\n\n## 이전 대화 맥락:\n${previousContext}`;
  }

  prompt += `\n\n위 질문에 대해 JSON 형식으로 답변해주세요. 다른 설명 없이 JSON만 반환해주세요.`;

  return prompt;
}
