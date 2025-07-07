import { WinStatus } from '../types/common';

export interface WinningNumbers {
  numbers: number[];
  bonusNumber: number;
}

export interface RecommendationNumbers {
  numbers: number[][];
}

/**
 * 추천 번호와 당첨번호를 비교하여 당첨상태를 계산합니다.
 * @param recommendation 추천 번호들
 * @param winningNumbers 당첨번호 (null이면 미추첨)
 * @returns 당첨상태 (WIN, LOSE, PENDING)
 */
export function calculateWinStatus(
  recommendation: RecommendationNumbers,
  winningNumbers: WinningNumbers | null
): WinStatus {
  // 당첨번호가 없으면 미추첨
  if (!winningNumbers) {
    return WinStatus.PENDING;
  }

  const { numbers: winningNums, bonusNumber } = winningNumbers;
  const { numbers: recommendationNums } = recommendation;

  // 각 추천 세트별로 당첨 여부 확인
  for (const numberSet of recommendationNums) {
    const matchCount = numberSet.filter(num => 
      winningNums.includes(num) || num === bonusNumber
    ).length;

    // 3개 이상 일치하면 당첨 (5등 이상)
    if (matchCount >= 3) {
      return WinStatus.WIN;
    }
  }

  // 모든 세트에서 3개 미만 일치하면 미당첨
  return WinStatus.LOSE;
}

/**
 * 당첨상태에 대한 상세 정보를 반환합니다.
 * @param recommendation 추천 번호들
 * @param winningNumbers 당첨번호
 * @returns 당첨 상세 정보
 */
export function getWinDetails(
  recommendation: RecommendationNumbers,
  winningNumbers: WinningNumbers | null
): {
  status: WinStatus;
  matchCounts: number[];
  maxMatchCount: number;
  bestRank: number | null;
} {
  if (!winningNumbers) {
    return {
      status: WinStatus.PENDING,
      matchCounts: [],
      maxMatchCount: 0,
      bestRank: null
    };
  }

  const { numbers: winningNums, bonusNumber } = winningNumbers;
  const { numbers: recommendationNums } = recommendation;

  const matchCounts: number[] = [];
  let maxMatchCount = 0;
  let bestRank: number | null = null;

  // 각 세트별 맞은 개수 계산
  for (const numberSet of recommendationNums) {
    const matchCount = numberSet.filter(num => 
      winningNums.includes(num) || num === bonusNumber
    ).length;
    
    matchCounts.push(matchCount);
    maxMatchCount = Math.max(maxMatchCount, matchCount);
  }

  // 최고 등수 계산 (3개 이상 일치해야 당첨)
  if (maxMatchCount >= 3) {
    if (maxMatchCount === 6) {
      bestRank = 1; // 1등: 6개 일치
    } else if (maxMatchCount === 5) {
      // 2등과 3등 구분: 보너스번호 포함 여부
      const hasBonusNumber = recommendationNums.some(set => 
        set.filter(num => winningNums.includes(num)).length === 5 && 
        set.some(num => num === bonusNumber)
      );
      bestRank = hasBonusNumber ? 2 : 3; // 2등: 5개+보너스, 3등: 5개
    } else if (maxMatchCount === 4) {
      bestRank = 4; // 4등: 4개 일치
    } else if (maxMatchCount === 3) {
      bestRank = 5; // 5등: 3개 일치
    }
  }

  const status = maxMatchCount >= 3 ? WinStatus.WIN : WinStatus.LOSE;

  return {
    status,
    matchCounts,
    maxMatchCount,
    bestRank
  };
} 