import {
  LotteryNumberSets,
  UserConditions,
  ImageExtractResult,
  RecommendationType,
  GPTModel,
} from '../types/common';

export class RecommendationHistory {
  constructor(
    public readonly id: string,
    public readonly round: number | null,
    public readonly numbers: LotteryNumberSets,
    public readonly type: RecommendationType,
    public readonly conditions: UserConditions | null,
    public readonly imageData: ImageExtractResult | null,
    public readonly gptModel: GPTModel,
    public readonly analysis: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public static create(
    id: string,
    numbers: LotteryNumberSets,
    type: RecommendationType,
    gptModel: GPTModel,
    round?: number,
    conditions?: UserConditions,
    imageData?: ImageExtractResult,
    analysis?: string,
  ): RecommendationHistory {
    const now = new Date();
    return new RecommendationHistory(
      id,
      round ?? null,
      numbers,
      type,
      conditions ?? null,
      imageData ?? null,
      gptModel,
      analysis ?? null,
      now,
      now,
    );
  }

  public validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('ID는 필수입니다.');
    }

    if (!this.numbers || this.numbers.length === 0) {
      throw new Error('추천 번호가 필요합니다.');
    }

    if (this.numbers.length < 1) {
      throw new Error('최소 1세트의 번호가 필요합니다.');
    }

    this.numbers.forEach((numberSet, index) => {
      if (numberSet.length !== 6) {
        throw new Error(`세트 ${index + 1}는 정확히 6개의 번호가 필요합니다.`);
      }

      numberSet.forEach(num => {
        if (num < 1 || num > 45) {
          throw new Error(`번호는 1-45 사이여야 합니다. 잘못된 번호: ${num}`);
        }
      });

      // 중복 번호 확인
      const uniqueNumbers = new Set(numberSet);
      if (uniqueNumbers.size !== 6) {
        throw new Error(`세트 ${index + 1}에 중복된 번호가 있습니다.`);
      }
    });

    if (this.round !== null && (this.round < 1 || this.round > 9999)) {
      throw new Error('회차는 1-9999 사이여야 합니다.');
    }
  }

  public isPremium(): boolean {
    return this.type === RecommendationType.PREMIUM;
  }

  public hasImageData(): boolean {
    return this.imageData !== null;
  }

  public getNumbersAsArray(): number[][] {
    return this.numbers.map(set => [...set].sort((a, b) => a - b));
  }
} 