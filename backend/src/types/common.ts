export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type LotteryNumbers = number[]; // [1, 2, 3, 4, 5, 6]
export type LotteryNumberSets = LotteryNumbers[]; // [[1,2,3,4,5,6], [7,8,9,10,11,12], ...]
export type WinningNumbers = number[]; // [1, 2, 3, 4, 5, 6] (보너스번호 제외)

export enum RecommendationType {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
}

export enum GPTModel {
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_4O = 'gpt-4o',
}

export enum WinStatus {
  WIN = 'WIN',        // 당첨
  LOSE = 'LOSE',      // 미당첨
  PENDING = 'PENDING' // 미추첨
}

export interface UserConditions {
  excludeNumbers?: number[];
  includeNumbers?: number[];
  recentPurchases?: LotteryNumberSets;
  preferences?: string;
}

export interface ImageExtractResult {
  numbers: LotteryNumberSets;
  extractedText?: string;
  notes?: string;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface RecommendationRequest {
  type: RecommendationType;
  gameCount?: number;
  round?: number;
  conditions?: UserConditions;
  imageNumbers?: LotteryNumberSets; // 이미지 분석 결과에서 추출된 번호들
}

export interface RecommendationResponse {
  gameCount: number;
  numbers: LotteryNumberSets;
  round?: number;
  analysis?: string;
}

export interface ReviewRequest {
  recommendationId: string;
  winningNumbers: WinningNumbers;
}

export interface ReviewResponse {
  id: string;
  recommendationId: string;
  winningNumbers: WinningNumbers;
  matchedCounts: number[];
  reviewText: string;
  analysisPrompt: string;
  createdAt: string;
}

export interface HealthCheckResponse {
  status: 'OK' | 'ERROR';
  timestamp: string;
  database: 'connected' | 'disconnected';
  dbTime?: string;
  environment: string;
  version: string;
}

export interface ErrorResponse extends ApiResponse {
  success: false;
  error: string;
  details?: any;
} 