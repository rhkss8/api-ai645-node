import { UserConditions, ImageExtractResult } from '@/types/common';

export interface PremiumRecommendationPromptParams {
  gameCount?: number; // 추천할 게임 수 (기본값: 5)
  conditions?: UserConditions;
  round?: number;
  imageData?: ImageExtractResult;
  previousReviews?: string[];
  confidence?: number; // 0-100 (기본값: 85)
}

/**
 * 프리미엄 로또 번호 추천용 프롬프트 생성
 * 반드시 **JSON 객체만** 응답하도록 유도한다.
 */
export const generatePremiumRecommendationPrompt = (
  params: PremiumRecommendationPromptParams,
): string => {
  const {
    gameCount = 5,
    conditions,
    round,
    imageData,
    previousReviews,
    confidence = 85,
  } = params;

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
- 각 세트는 1~45 사이의 **서로 다른 정수형 6개 숫자**로 구성
- 총 ${gameCount}세트를 추천
- 각 세트는 서로 다른 전략을 적용
- **모든 번호는 반드시 정수형이어야 함 (문자열 금지)**`;

  /* ----- 추가 파라미터 처리 ----- */

  if (round) {
    prompt += `\n\n## 대상 회차\n${round}회차를 대상으로 고급 분석을 수행하여 추천해주세요.`;
  }

  if (imageData?.numbers?.length) {
    prompt += `\n\n## 이미지 분석 결과\n이미지에서 추출된 번호 조합들:`;
    imageData.numbers.forEach((numbers, idx) => {
      prompt += `\n${idx + 1}. [${numbers.join(', ')}]`;
    });
    prompt += `\n\n**중요**: 위 조합과 **완전히 동일한** 번호 세트는 추천하지 마세요.\n단, 개별 숫자를 다른 조합에서 사용하는 것은 허용됩니다.`;
  }

  if (conditions) {
    const { excludeNumbers, includeNumbers, recentPurchases, preferences } = conditions;

    if (excludeNumbers?.length) {
      prompt += `\n\n## 반드시 제외할 번호\n${excludeNumbers.join(', ')}`;
    }

    if (includeNumbers?.length) {
      prompt += `\n\n## 우선 고려 번호\n${includeNumbers.join(', ')}`;
    }

    if (recentPurchases?.length) {
      prompt += `\n\n## 최근 당첨 번호 (최근 ${recentPurchases.length}회차)\n과거 당첨 패턴 분석:`;
      recentPurchases.forEach((p, idx) => {
        prompt += `\n${idx + 1}. [${p.join(', ')}]`;
      });
      prompt += `\n\n위 당첨 패턴을 분석하여 유사한 패턴을 피하거나 반대로 활용해주세요.`;
    }

    if (preferences) {
      prompt += `\n\n## 추가 선호사항\n${preferences}`;
    }

    // 충돌 우선순위 명시
    prompt += `\n\n**규칙 우선순위**: (1) 제외 번호 > (2) 포함 번호`;
  }

  if (previousReviews?.length) {
    prompt += `\n\n## 과거 추천 회고\n이전 분석 및 개선점:`;
    previousReviews.forEach((r, idx) => {
      prompt += `\n${idx + 1}. ${r}`;
    });
    prompt += `\n위 회고를 반영해 성공 패턴은 강화하고 실패 요인은 보완해주세요.`;
  }

  /* ----- 응답 포맷 가이드 ----- */

  prompt += `

## 응답 형식 (반드시 JSON **객체만** 반환, 마크다운·주석·공백 금지)
{
  "recommendations": [
    [],
    []
  ],
  "analysis": "종합 분석 및 추천 근거 다음 회차 추천시 회고용으로 기록될 수 있도록 상세하게 작성(500자 이내)",
  "confidence": 1~100 사이의 숫자
}`;

  return prompt.trim();
};

export default generatePremiumRecommendationPrompt;
