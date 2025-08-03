import { RecommendationHistory } from '../entities/RecommendationHistory';
import { IRecommendationHistoryRepository } from '../repositories/IRecommendationHistoryRepository';
import { IWinningNumbersRepository } from '../repositories/IWinningNumbersRepository';
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
    private readonly winningNumbersRepository: IWinningNumbersRepository,
    private readonly gptService: IGPTService,
  ) {}

  async execute(request: RecommendationRequest): Promise<RecommendationResponse> {
    // 1. 입력 검증
    this.validateRequest(request);

    // 2. 회차 자동 설정 (가장 최근 회차 + 1)
    let targetRound = request.round;
    if (!targetRound) {
      try {
        const latestRound = await this.winningNumbersRepository.getLatestRound();
        targetRound = latestRound + 1;
        console.log(`🎯 회차 자동 설정: 최근 회차 ${latestRound} → 추천 회차 ${targetRound}`);
      } catch (error) {
        console.warn('최근 회차 조회 실패, 기본값 1 사용:', error);
        targetRound = 1;
      }
    } else {
      console.log(`🎯 사용자 지정 회차: ${targetRound}`);
    }

    // 3. 게임수 설정 (기본값 설정)
    const gameCount = this.validateAndSetGameCount(request);
    console.log(`🎮 게임수 설정: ${gameCount}게임 (요청: ${request.gameCount || '없음'})`);

    // 4. 최근 당첨 번호 가져오기 (최근 10회차)
    let recentWinningNumbers: number[][] = [];
    try {
      const recentWinnings = await this.winningNumbersRepository.findRecent(10);
      recentWinningNumbers = recentWinnings.map(winning => {
        // numbers가 배열인지 확인하고 안전하게 처리
        if (Array.isArray(winning.numbers)) {
          return winning.numbers;
        } else {
          console.warn(`Invalid winning numbers structure:`, winning.numbers);
          return [];
        }
      }).filter(numbers => numbers.length > 0); // 빈 배열 제거
      console.log(`🏆 최근 당첨 번호 ${recentWinningNumbers.length}회차 로드됨`);
    } catch (error) {
      console.warn('최근 당첨 번호 로드 실패:', error);
    }

    // 5. 조건에 최근 당첨 번호 추가
    const enhancedConditions = {
      ...request.conditions,
      recentPurchases: recentWinningNumbers, // 최근 당첨 번호로 대체
    };

    // 6. 이미지 번호 처리 (프리미엄만)
    let imageData: ImageExtractResult | undefined;
    if (request.type === RecommendationType.PREMIUM && request.imageNumbers) {
      try {
        // 이미지 분석 결과에서 추출된 번호들을 ImageExtractResult 형태로 변환
        imageData = {
          numbers: request.imageNumbers,
          extractedText: '이미지 분석 API에서 추출된 번호들',
          notes: `${request.imageNumbers.length}게임이 이미지에서 추출되었습니다.`,
        };
        console.log('🔍 이미지 번호 데이터 처리됨:', JSON.stringify(imageData, null, 2));
      } catch (error) {
        console.warn('이미지 번호 처리 실패, 이미지 없이 추천 진행:', error);
      }
    }

    // 7. GPT 모델 선택
    const gptModel = this.selectGPTModel(request.type);

    // 8. 이전 회고 가져오기 (개선을 위해)
    const previousReviews = await this.getPreviousReviews();

    // 9. 번호 추천 생성 (게임수 전달)
    const gptResult = await this.gptService.generateRecommendation(
      gptModel,
      gameCount, // 게임수 추가
      enhancedConditions, // 최근 당첨 번호가 포함된 조건
      targetRound, // 자동 설정된 회차 사용
      imageData, // 무료/프리미엄 상관없이 이미지 데이터 전달
      previousReviews,
    );

    // 10. 추천 엔티티 생성 및 검증
    const id = IdGenerator.generateRecommendationId();
    const recommendation = RecommendationHistory.create(
      id,
      gptResult.numbers,
      request.type,
      gptModel,
      targetRound, // 자동 설정된 회차 사용
      request.conditions,
      imageData,
      gptResult.analysis, // GPT 분석 결과 추가
      request.userId, // 사용자 ID 추가
    );

    recommendation.validate();

    // 11. 데이터베이스 저장
    console.log('💾 데이터베이스 저장 시작:', JSON.stringify(recommendation, null, 2));
    let savedRecommendation;
    try {
      savedRecommendation = await this.recommendationRepository.create(recommendation);
      console.log('✅ 데이터베이스 저장 성공:', savedRecommendation.id);
    } catch (dbError) {
      console.error('❌ 데이터베이스 저장 실패:', dbError);
      throw dbError;
    }

    // 12. 응답 변환 (GPT 분석 결과 포함)
    return this.toResponse(savedRecommendation, gameCount, gptResult.analysis);
  }

  private validateRequest(request: RecommendationRequest): void {
    if (!request.type) {
      throw new Error('추천 타입은 필수입니다.');
    }

    if (!Object.values(RecommendationType).includes(request.type)) {
      throw new Error('올바르지 않은 추천 타입입니다.');
    }

    // round가 있으면 검증, 없으면 자동 설정 예정
    if (request.round && (request.round < 1 || request.round > 9999)) {
      throw new Error('회차는 1-9999 사이여야 합니다.');
    }

    if (request.conditions) {
      this.validateConditions(request.conditions);
    }

    // 프리미엄 타입에서만 이미지 번호 허용
    if (request.imageNumbers && request.type !== RecommendationType.PREMIUM) {
      throw new Error('이미지 번호는 프리미엄 추천에서만 지원됩니다.');
    }

    // 이미지 번호 검증
    if (request.imageNumbers) {
      this.validateImageNumbers(request.imageNumbers);
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

  private validateImageNumbers(imageNumbers: number[][]): void {
    if (!Array.isArray(imageNumbers)) {
      throw new Error('이미지 번호는 배열이어야 합니다.');
    }

    if (imageNumbers.length === 0) {
      throw new Error('이미지 번호가 비어있습니다.');
    }

    if (imageNumbers.length > 10) {
      throw new Error('이미지 번호는 최대 10게임까지 가능합니다.');
    }

    for (let i = 0; i < imageNumbers.length; i++) {
      const game = imageNumbers[i];
      
      if (!Array.isArray(game)) {
        throw new Error(`게임 ${i + 1}의 번호는 배열이어야 합니다.`);
      }

      if (game.length !== 6) {
        throw new Error(`게임 ${i + 1}은 정확히 6개의 번호를 가져야 합니다.`);
      }

      for (let j = 0; j < game.length; j++) {
        const num = game[j];
        if (typeof num !== 'number' || num < 1 || num > 45) {
          throw new Error(`게임 ${i + 1}의 번호 ${j + 1}은 1-45 사이의 숫자여야 합니다.`);
        }
      }

      // 중복 번호 확인
      const uniqueNumbers = [...new Set(game)];
      if (uniqueNumbers.length !== 6) {
        throw new Error(`게임 ${i + 1}에 중복된 번호가 있습니다.`);
      }
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