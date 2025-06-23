import { LotteryNumberSets, WinningNumbers, UserConditions } from '@/types/common';

export interface ReviewPromptParams {
  recommendedNumbers: LotteryNumberSets;
  winningNumbers: WinningNumbers;
  matchedCounts: number[];
  conditions?: UserConditions;
}

export const generateReviewPrompt = (params: ReviewPromptParams): string => {
  const { recommendedNumbers, winningNumbers, matchedCounts, conditions } = params;

  const totalMatches = matchedCounts.reduce((sum, count) => sum + count, 0);
  const bestMatch = Math.max(...matchedCounts);
  const averageMatch = totalMatches / matchedCounts.length;

  let prompt = `로또 번호 추천 결과에 대한 분석 회고를 작성해주세요.

## 추천 결과 분석
### 추천했던 번호들:`;

  recommendedNumbers.forEach((numbers, index) => {
    prompt += `\n${index + 1}세트: [${numbers.join(', ')}] → ${matchedCounts[index] ?? 0}개 맞음`;
  });

  const mainWinning = winningNumbers.slice(0, 6).sort((a, b) => a - b);
  const bonusNumber = winningNumbers[6];
  
  prompt += `\n\n### 실제 당첨번호: [${mainWinning.join(', ')}] + 보너스: ${bonusNumber ?? '?'}`;
  
  prompt += `\n\n### 매칭 결과 요약:
- 총 맞은 개수: ${totalMatches}개
- 최고 매칭: ${bestMatch}개
- 평균 매칭: ${averageMatch.toFixed(1)}개`;

  const grades = matchedCounts.map(count => {
    if (count === 6) return '1등';
    if (count === 5) return '3등';
    if (count === 4) return '4등';
    if (count === 3) return '5등';
    return '낙첨';
  });

  prompt += `\n- 당첨 등급: ${grades.join(', ')}`;

  if (conditions) {
    prompt += `\n\n### 사용된 조건:`;
    
    if (conditions.excludeNumbers && conditions.excludeNumbers.length > 0) {
      prompt += `\n- 제외 번호: [${conditions.excludeNumbers.join(', ')}]`;
    }
    
    if (conditions.includeNumbers && conditions.includeNumbers.length > 0) {
      prompt += `\n- 포함 번호: [${conditions.includeNumbers.join(', ')}]`;
    }
    
    if (conditions.recentPurchases && conditions.recentPurchases.length > 0) {
      prompt += `\n- 최근 구매 이력 반영됨`;
    }
    
    if (conditions.preferences) {
      prompt += `\n- 사용자 선호사항: ${conditions.preferences}`;
    }
  }

  prompt += `

## 분석 요청사항
다음 관점에서 심층적인 회고 분석을 해주세요:

1. **패턴 분석**: 맞은 번호들의 패턴과 특징 분석
2. **실패 요인**: 왜 더 많이 맞지 못했는지 분석
3. **성공 요인**: 맞은 번호들의 공통점과 성공 전략
4. **번호 분포**: 구간별, 홀짝별, 연속성 등의 분포 분석
5. **개선 방향**: 다음 추천 시 적용할 수 있는 개선점
6. **통계적 해석**: 확률론적 관점에서의 결과 해석

## 응답 요구사항
- 객관적이고 분석적인 톤
- 구체적인 숫자와 패턴 제시
- 건설적인 개선 제안
- 300-500자 분량
- 감정적 표현보다는 논리적 분석 중심

전문적이고 유용한 회고 분석을 작성해주세요.`;

  return prompt.trim();
};

export default generateReviewPrompt; 