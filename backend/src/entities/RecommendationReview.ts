import { WinningNumbers } from '@/types/common';

export class RecommendationReview {
  constructor(
    public readonly id: string,
    public readonly recommendationId: string,
    public readonly winningNumbers: WinningNumbers,
    public readonly matchedCounts: number[],
    public readonly reviewText: string,
    public readonly analysisPrompt: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public static create(
    id: string,
    recommendationId: string,
    winningNumbers: WinningNumbers,
    matchedCounts: number[],
    reviewText: string,
    analysisPrompt: string,
  ): RecommendationReview {
    const now = new Date();
    return new RecommendationReview(
      id,
      recommendationId,
      winningNumbers,
      matchedCounts,
      reviewText,
      analysisPrompt,
      now,
      now,
    );
  }

  public validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('ID는 필수입니다.');
    }

    if (!this.recommendationId || this.recommendationId.trim() === '') {
      throw new Error('추천 ID는 필수입니다.');
    }

    if (!this.winningNumbers || this.winningNumbers.length !== 7) {
      throw new Error('당첨번호는 7개(보너스번호 포함)여야 합니다.');
    }

    this.winningNumbers.forEach(num => {
      if (num < 1 || num > 45) {
        throw new Error(`당첨번호는 1-45 사이여야 합니다. 잘못된 번호: ${num}`);
      }
    });

    // 중복 번호 확인
    const uniqueNumbers = new Set(this.winningNumbers);
    if (uniqueNumbers.size !== 7) {
      throw new Error('당첨번호에 중복된 번호가 있습니다.');
    }

    if (!this.matchedCounts || this.matchedCounts.length !== 5) {
      throw new Error('매칭 개수는 5개여야 합니다.');
    }

    this.matchedCounts.forEach((count, index) => {
      if (count < 0 || count > 6) {
        throw new Error(`세트 ${index + 1}의 매칭 개수가 잘못되었습니다: ${count}`);
      }
    });

    if (!this.reviewText || this.reviewText.trim() === '') {
      throw new Error('회고문은 필수입니다.');
    }

    if (!this.analysisPrompt || this.analysisPrompt.trim() === '') {
      throw new Error('분석 프롬프트는 필수입니다.');
    }
  }

  public getTotalMatches(): number {
    return this.matchedCounts.reduce((sum, count) => sum + count, 0);
  }

  public getBestMatch(): number {
    return Math.max(...this.matchedCounts);
  }

  public getWorstMatch(): number {
    return Math.min(...this.matchedCounts);
  }

  public getAverageMatch(): number {
    return this.getTotalMatches() / this.matchedCounts.length;
  }

  public hasAnyWinningSet(): boolean {
    // 3개 이상 맞으면 당첨 (5등 이상)
    return this.matchedCounts.some(count => count >= 3);
  }

  public getWinningGrades(): string[] {
    return this.matchedCounts.map(count => {
      switch (count) {
        case 6:
          return '1등';
        case 5:
          return '3등';
        case 4:
          return '4등';
        case 3:
          return '5등';
        default:
          return '낙첨';
      }
    });
  }
} 