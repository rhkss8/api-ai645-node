import { UserConditions, ImageExtractResult } from '@/types/common';

export interface PremiumRecommendationPromptParams {
  gameCount?: number; // 추천할 게임수 (기본값: 5)
  conditions?: UserConditions;
  round?: number;
  imageData?: ImageExtractResult;
  previousReviews?: string[];
}

export const generatePremiumRecommendationPrompt = (
  params: PremiumRecommendationPromptParams,
): string => {
  const { gameCount = 5, conditions, round, imageData, previousReviews } = params;

  let prompt = `당신은 고급 로또 번호 추천 전문가입니다. 고도의 분석과 패턴 인식을 통해 프리미엄 로또 번호 ${gameCount}세트를 추천해주세요.

## 프리미엄 추천 전략
- 심층적 통계 분석 및 고급 패턴 인식
- 다차원 번호 분포 분석
- 시계열 분석을 통한 트렌드 예측
- 머신러닝 기반 번호 상관관계 분석
- 수리적 모델링과 확률론적 접근

## 고급 분석 요소
1. 출현 빈도의 가중 평균 분석
2. 번호 간 상관관계 매트릭스
3. 시간대별 패턴 변화 추이
4. 구간별 밀도 분포 최적화
5. 연속성과 무작위성의 균형점
6. 과거 당첨 패턴의 심층 분석

## 기본 규칙
- 각 세트는 1~45 사이의 서로 다른 6개 숫자로 구성
- 총 ${gameCount}세트를 추천
- 각 세트는 서로 다른 전략을 적용`;

  if (round) {
    prompt += `\n\n## 대상 회차\n${round}회차를 대상으로 고급 분석을 수행하여 추천해주세요.`;
  }

  if (imageData && imageData.numbers && imageData.numbers.length > 0) {
    prompt += `\n\n## 이미지 분석 결과\n이미지에서 추출된 번호 조합들:`;
    imageData.numbers.forEach((numbers, index) => {
      prompt += `\n${index + 1}. [${numbers.join(', ')}]`;
    });
    prompt += `\n\n**중요**: 위 조합들과 완전히 동일한 번호 조합은 추천하지 마세요. 
하지만 이 번호들을 다른 조합에서 사용하는 것은 가능합니다.
예시: 이미지에 [1,2,3,4,5,6]이 있다면, [1,2,3,4,5,6] 조합은 제외하지만 
[1,7,14,21,28,35] 같이 1이 포함된 다른 조합은 추천 가능합니다.`;
  }

  if (conditions) {
    if (conditions.excludeNumbers && conditions.excludeNumbers.length > 0) {
      prompt += `\n\n## 제외할 번호\n다음 번호들은 반드시 제외: ${conditions.excludeNumbers.join(', ')}`;
    }

    if (conditions.includeNumbers && conditions.includeNumbers.length > 0) {
      prompt += `\n\n## 우선 포함 번호\n다음 번호들을 우선적으로 고려: ${conditions.includeNumbers.join(', ')}`;
    }

    if (conditions.recentPurchases && conditions.recentPurchases.length > 0) {
      prompt += `\n\n## 사용자 구매 이력 분석\n최근 구매 패턴을 분석하여 개선된 추천을 제공:`;
      conditions.recentPurchases.forEach((purchase, index) => {
        prompt += `\n${index + 1}. [${purchase.join(', ')}]`;
      });
      prompt += `\n\n위 패턴을 분석하여 사용자의 선호도와 개선점을 반영해주세요.`;
    }

    if (conditions.preferences) {
      prompt += `\n\n## 사용자 고급 선호사항\n${conditions.preferences}`;
    }
  }

  if (previousReviews && previousReviews.length > 0) {
    prompt += `\n\n## 과거 추천 분석 및 학습\n이전 추천의 회고 분석을 통한 개선된 추천:`;
    previousReviews.forEach((review, index) => {
      prompt += `\n${index + 1}. ${review}\n`;
    });
    prompt += `\n위 분석 내용을 바탕으로 성공 패턴은 강화하고 실패 요인은 보완해주세요.`;
  }

  prompt += `

## 프리미엄 응답 형식
정확히 아래 JSON 형식으로만 응답해주세요 (마크다운 코드블록 없이). ${gameCount}개의 세트와 각 세트별 상세 분석을 포함하세요.

{
  "recommendations": [
    // ${gameCount}개의 번호 세트를 여기에 배열 형태로 제공
    // 예시: [1, 7, 14, 21, 28, 35]
  ],
  "analysis": "종합적인 분석 결과와 추천 근거 (200자 이내)",
  "strategies": [
    // ${gameCount}개의 각 세트별 전략 설명
    // 예시: "세트 1 전략 설명"
  ],
  "confidence": 85
}
`;

  return prompt.trim();
};

export default generatePremiumRecommendationPrompt; 