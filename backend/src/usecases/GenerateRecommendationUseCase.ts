import { RecommendationHistory } from '../entities/RecommendationHistory';
import { IRecommendationHistoryRepository } from '../repositories/IRecommendationHistoryRepository';
import { IGPTService, GPTRecommendationResult } from '../repositories/IGPTService';
import { IdGenerator } from '../utils/idGenerator';
import {
  RecommendationRequest,
  RecommendationResponse,
  RecommendationType,
  GPTModel,
  ImageExtractResult,
} from '../types/common';

export class GenerateRecommendationUseCase {
  constructor(
    private readonly recommendationRepository: IRecommendationHistoryRepository,
    private readonly gptService: IGPTService,
  ) {}

  async execute(request: RecommendationRequest): Promise<RecommendationResponse> {
    // 1. 입력 검증
    this.validateRequest(request);

    // 2. 게임수 설정 (기본값 설정)
    const gameCount = this.validateAndSetGameCount(request);

    // 3. 이미지 처리 (프리미엄만)
    let imageData: ImageExtractResult | undefined;
    if (request.type === RecommendationType.PREMIUM && request.image) {
      try {
        imageData = await this.gptService.extractNumbersFromImage(request.image);
      } catch (error) {
        console.warn('이미지 처리 실패, 이미지 없이 추천 진행:', error);
      }
    }

    // 4. GPT 모델 선택
    const gptModel = this.selectGPTModel(request.type);

    // 5. 이전 회고 가져오기 (개선을 위해)
    const previousReviews = await this.getPreviousReviews();

    // 6. 번호 추천 생성 (게임수 전달)
    const gptResult = await this.gptService.generateRecommendation(
      gptModel,
      gameCount, // 게임수 추가
      request.conditions,
      request.round,
      imageData, // 무료/프리미엄 상관없이 이미지 데이터 전달
      previousReviews,
    );

    // 7. 추천 엔티티 생성 및 검증
    const id = IdGenerator.generateRecommendationId();
    const recommendation = RecommendationHistory.create(
      id,
      gptResult.numbers,
      request.type,
      gptModel,
      request.round,
      request.conditions,
      imageData,
    );

    recommendation.validate();

    // 8. 데이터베이스 저장
    const savedRecommendation = await this.recommendationRepository.create(recommendation);

    // 9. 응답 변환 (GPT 분석 결과 포함)
    return this.toResponse(savedRecommendation, gameCount, gptResult.analysis);
  }

  private validateRequest(request: RecommendationRequest): void {
    if (!request.type) {
      throw new Error('추천 타입은 필수입니다.');
    }

    if (!Object.values(RecommendationType).includes(request.type)) {
      throw new Error('올바르지 않은 추천 타입입니다.');
    }

    if (request.round && (request.round < 1 || request.round > 9999)) {
      throw new Error('회차는 1-9999 사이여야 합니다.');
    }

    if (request.conditions) {
      this.validateConditions(request.conditions);
    }

    // 프리미엄 타입에서만 이미지 허용
    if (request.image && request.type !== RecommendationType.PREMIUM) {
      throw new Error('이미지 업로드는 프리미엄 추천에서만 지원됩니다.');
    }

    // 이미지 크기 및 형식 검증
    if (request.image) {
      this.validateImage(request.image);
    }
  }

  private validateAndSetGameCount(request: RecommendationRequest): number {
    let gameCount = request.gameCount || 5; // 기본값 5

    // 타입별 최대 게임수 제한
    const maxGameCount = request.type === RecommendationType.PREMIUM ? 10 : 5;
    
    if (gameCount < 1) {
      throw new Error('게임수는 최소 1개 이상이어야 합니다.');
    }

    if (gameCount > maxGameCount) {
      throw new Error(`${request.type === RecommendationType.PREMIUM ? '프리미엄' : '무료'} 추천은 최대 ${maxGameCount}게임까지 가능합니다.`);
    }

    return gameCount;
  }

  private validateConditions(conditions: any): void {
    if (conditions.excludeNumbers) {
      if (!Array.isArray(conditions.excludeNumbers)) {
        throw new Error('제외할 번호는 배열이어야 합니다.');
      }
      
      for (const num of conditions.excludeNumbers) {
        if (typeof num !== 'number' || num < 1 || num > 45) {
          throw new Error('제외할 번호는 1-45 사이의 숫자여야 합니다.');
        }
      }

      if (conditions.excludeNumbers.length > 20) {
        throw new Error('제외할 번호는 최대 20개까지 가능합니다.');
      }
    }

    if (conditions.includeNumbers) {
      if (!Array.isArray(conditions.includeNumbers)) {
        throw new Error('포함할 번호는 배열이어야 합니다.');
      }
      
      for (const num of conditions.includeNumbers) {
        if (typeof num !== 'number' || num < 1 || num > 45) {
          throw new Error('포함할 번호는 1-45 사이의 숫자여야 합니다.');
        }
      }

      if (conditions.includeNumbers.length > 6) {
        throw new Error('포함할 번호는 최대 6개까지 가능합니다.');
      }
    }

    if (conditions.recentPurchases) {
      if (!Array.isArray(conditions.recentPurchases)) {
        throw new Error('최근 구매 이력은 배열이어야 합니다.');
      }

      if (conditions.recentPurchases.length > 10) {
        throw new Error('최근 구매 이력은 최대 10개까지 가능합니다.');
      }

      for (const purchase of conditions.recentPurchases) {
        if (!Array.isArray(purchase) || purchase.length !== 6) {
          throw new Error('각 구매 이력은 6개의 번호를 가져야 합니다.');
        }
        
        for (const num of purchase) {
          if (typeof num !== 'number' || num < 1 || num > 45) {
            throw new Error('구매 이력의 번호는 1-45 사이의 숫자여야 합니다.');
          }
        }
      }
    }

    if (conditions.preferences && typeof conditions.preferences !== 'string') {
      throw new Error('선호사항은 문자열이어야 합니다.');
    }

    if (conditions.preferences && conditions.preferences.length > 500) {
      throw new Error('선호사항은 최대 500자까지 가능합니다.');
    }
  }

  private validateImage(image: any): void {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimeTypes.includes(image.mimetype)) {
      throw new Error('지원하지 않는 이미지 형식입니다. JPEG, PNG, WebP만 가능합니다.');
    }

    if (image.size > maxSize) {
      throw new Error('이미지 크기는 10MB 이하여야 합니다.');
    }
  }

  private selectGPTModel(type: RecommendationType): GPTModel {
    return type === RecommendationType.PREMIUM ? GPTModel.GPT_4O : GPTModel.GPT_3_5_TURBO;
  }

  private async getPreviousReviews(): Promise<string[]> {
    try {
      // 최근 성공적인 회고 3개 가져오기
      const recentRecommendations = await this.recommendationRepository.findRecent(10);
      // TODO: 실제로는 회고 저장소에서 성공률이 높은 회고들을 가져와야 함
      return [];
    } catch (error) {
      console.warn('이전 회고 가져오기 실패:', error);
      return [];
    }
  }

  private toResponse(recommendation: RecommendationHistory, gameCount: number, analysis?: string): RecommendationResponse {
    return {
      gameCount: gameCount,
      numbers: recommendation.numbers,
      round: recommendation.round || undefined,
      analysis: analysis,
    };
  }
} 