import {
  LotteryNumberSets,
  UserConditions,
  ImageExtractResult,
  GPTModel,
  WinningNumbers,
  UploadedFile,
} from '@/types/common';

export interface IGPTService {
  generateRecommendation(
    model: GPTModel,
    conditions?: UserConditions,
    round?: number,
    imageData?: ImageExtractResult,
    previousReviews?: string[],
  ): Promise<LotteryNumberSets>;

  extractNumbersFromImage(
    image: UploadedFile,
  ): Promise<ImageExtractResult>;

  generateReview(
    recommendedNumbers: LotteryNumberSets,
    winningNumbers: WinningNumbers,
    matchedCounts: number[],
    conditions?: UserConditions,
  ): Promise<string>;

  validateResponse(response: string): boolean;
  parseNumbersFromResponse(response: string): LotteryNumberSets;
} 