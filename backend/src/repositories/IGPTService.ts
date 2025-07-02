import {
  LotteryNumberSets,
  UserConditions,
  ImageExtractResult,
  GPTModel,
  WinningNumbers,
  UploadedFile,
} from '@/types/common';

// GPT 응답 파싱 결과 타입 추가
export interface GPTRecommendationResult {
  numbers: LotteryNumberSets;
  analysis?: string;
  strategies?: string[];
  confidence?: number;
}

export interface IGPTService {
  generateRecommendation(
    model: GPTModel,
    gameCount: number,
    conditions?: UserConditions,
    round?: number,
    imageData?: ImageExtractResult,
    previousReviews?: string[],
  ): Promise<GPTRecommendationResult>;

  extractNumbersFromImage(
    image: UploadedFile,
  ): Promise<ImageExtractResult>;

  generateReview(
    recommendedNumbers: LotteryNumberSets,
    winningNumbers: WinningNumbers,
    matchedCounts: number[],
    conditions?: UserConditions,
  ): Promise<string>;

  validateResponse(response: string, expectedGameCount?: number): boolean;
  parseNumbersFromResponse(response: string, expectedGameCount?: number): LotteryNumberSets;
  parseRecommendationFromResponse(response: string, expectedGameCount?: number): GPTRecommendationResult;
} 