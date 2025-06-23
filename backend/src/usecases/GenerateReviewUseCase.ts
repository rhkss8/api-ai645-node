import { RecommendationReview } from '../entities/RecommendationReview';
import { RecommendationHistory } from '../entities/RecommendationHistory';
import { IRecommendationHistoryRepository } from '../repositories/IRecommendationHistoryRepository';
import { IRecommendationReviewRepository } from '../repositories/IRecommendationReviewRepository';
import { IGPTService } from '../repositories/IGPTService';
import { IdGenerator } from '../utils/idGenerator';
import {
  ReviewRequest,
  ReviewResponse,
  WinningNumbers,
  LotteryNumberSets,
} from '../types/common';

export class GenerateReviewUseCase {
  constructor(
    private readonly recommendationRepository: IRecommendationHistoryRepository,
    private readonly reviewRepository: IRecommendationReviewRepository,
    private readonly gptService: IGPTService,
  ) {}

  async execute(request: ReviewRequest): Promise<ReviewResponse> {
    // 1. 입력 검증
    this.validateRequest(request);

    // 2. 추천 내역 조회
    const recommendation = await this.recommendationRepository.findById(request.recommendationId);
    if (!recommendation) {
      throw new Error('추천 내역을 찾을 수 없습니다.');
    }

    // 3. 이미 회고가 존재하는지 확인
    const existingReviews = await this.reviewRepository.findByRecommendationId(request.recommendationId);
    if (existingReviews.length > 0) {
      throw new Error('이미 회고가 작성된 추천입니다.');
    }

    // 4. 매칭 개수 계산
    const matchedCounts = this.calculateMatches(recommendation.numbers, request.winningNumbers);

    // 5. GPT를 통한 회고 생성
    const reviewText = await this.gptService.generateReview(
      recommendation.numbers,
      request.winningNumbers,
      matchedCounts,
      recommendation.conditions || undefined,
    );

    // 6. 회고 엔티티 생성 및 검증
    const id = IdGenerator.generateReviewId();
    const review = RecommendationReview.create(
      id,
      request.recommendationId,
      request.winningNumbers,
      matchedCounts,
      reviewText,
      this.generateAnalysisPrompt(recommendation, request.winningNumbers),
    );

    review.validate();

    // 7. 데이터베이스 저장
    const savedReview = await this.reviewRepository.create(review);

    // 8. 응답 변환
    return this.toResponse(savedReview);
  }

  private validateRequest(request: ReviewRequest): void {
    if (!request.recommendationId) {
      throw new Error('추천 ID는 필수입니다.');
    }

    if (!request.winningNumbers) {
      throw new Error('당첨번호는 필수입니다.');
    }

    if (!Array.isArray(request.winningNumbers) || request.winningNumbers.length !== 7) {
      throw new Error('당첨번호는 7개(보너스번호 포함)여야 합니다.');
    }

    // 번호 유효성 검증
    for (const num of request.winningNumbers) {
      if (typeof num !== 'number' || num < 1 || num > 45) {
        throw new Error('당첨번호는 1-45 사이의 숫자여야 합니다.');
      }
    }

    // 중복 번호 확인
    const uniqueNumbers = new Set(request.winningNumbers);
    if (uniqueNumbers.size !== 7) {
      throw new Error('당첨번호에 중복된 번호가 있습니다.');
    }
  }

  private calculateMatches(recommendedSets: LotteryNumberSets, winningNumbers: WinningNumbers): number[] {
    const mainWinningNumbers = winningNumbers.slice(0, 6); // 보너스번호 제외
    
    return recommendedSets.map(recommendedSet => {
      return recommendedSet.filter(num => mainWinningNumbers.includes(num)).length;
    });
  }

  private generateAnalysisPrompt(
    recommendation: RecommendationHistory,
    winningNumbers: WinningNumbers,
  ): string {
    return `추천 분석: ${recommendation.type} 타입, GPT 모델: ${recommendation.gptModel}, 당첨번호: [${winningNumbers.join(', ')}]`;
  }

  private toResponse(review: RecommendationReview): ReviewResponse {
    return {
      id: review.id,
      recommendationId: review.recommendationId,
      winningNumbers: review.winningNumbers,
      matchedCounts: review.matchedCounts,
      reviewText: review.reviewText,
      analysisPrompt: review.analysisPrompt,
      createdAt: review.createdAt.toISOString(),
    };
  }
} 