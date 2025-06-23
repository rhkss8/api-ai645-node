import { UserConditions } from '../types/common';

export interface FreeRecommendationPromptParams {
  conditions?: UserConditions;
  round?: number;
  previousReviews?: string[];
}

export const generateFreeRecommendationPrompt = (
  params: FreeRecommendationPromptParams,
): string => {
  const { conditions, round, previousReviews } = params;

  let prompt = `당신은 로또 번호 추천 전문가입니다. 사용자를 위해 로또 번호 5세트를 추천해주세요.

## 기본 규칙
- 각 세트는 1~45 사이의 서로 다른 6개 숫자로 구성
- 총 5세트를 추천
- 통계적 분석과 패턴 분석을 활용
- 과도한 연속 번호나 패턴은 피하기

## 추천 전략
1. 고빈도 출현 번호와 저빈도 번호의 균형
2. 홀수/짝수 비율 고려 (3:3 또는 4:2 권장)
3. 번호 구간별 분산 (1-10, 11-20, 21-30, 31-40, 41-45)
4. 최근 트렌드 반영`;

  if (round) {
    prompt += `\n\n## 대상 회차\n${round}회차를 대상으로 추천해주세요.`;
  }

  if (conditions) {
    if (conditions.excludeNumbers && conditions.excludeNumbers.length > 0) {
      prompt += `\n\n## 제외할 번호\n다음 번호들은 제외해주세요: ${conditions.excludeNumbers.join(', ')}`;
    }

    if (conditions.includeNumbers && conditions.includeNumbers.length > 0) {
      prompt += `\n\n## 포함할 번호\n다음 번호들을 포함해주세요: ${conditions.includeNumbers.join(', ')}`;
    }

    if (conditions.recentPurchases && conditions.recentPurchases.length > 0) {
      prompt += `\n\n## 최근 구매 번호\n사용자가 최근에 구매한 번호들입니다. 참고해주세요:`;
      conditions.recentPurchases.forEach((purchase, index) => {
        prompt += `\n${index + 1}. [${purchase.join(', ')}]`;
      });
    }

    if (conditions.preferences) {
      prompt += `\n\n## 사용자 선호사항\n${conditions.preferences}`;
    }
  }

  if (previousReviews && previousReviews.length > 0) {
    prompt += `\n\n## 이전 추천 회고\n과거 추천에 대한 회고 내용을 참고하여 개선된 추천을 해주세요:`;
    previousReviews.forEach((review, index) => {
      prompt += `\n${index + 1}. ${review}\n`;
    });
  }

  prompt += `

## 응답 형식
정확히 아래 JSON 형식으로만 응답해주세요. 다른 설명은 포함하지 마세요.

{
  "recommendations": [
    [1, 7, 14, 21, 28, 35],
    [3, 12, 19, 26, 33, 40],
    [5, 8, 17, 24, 31, 42],
    [2, 11, 18, 25, 32, 39],
    [6, 13, 20, 27, 34, 41]
  ],
  "analysis": "추천 근거에 대한 간단한 설명 (100자 이내)"
}`;

  return prompt.trim();
};

export default generateFreeRecommendationPrompt; 