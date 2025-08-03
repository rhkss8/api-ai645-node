import { RecommendationParams } from '../entities/RecommendationParams';
import { IRecommendationParamsRepository } from '../repositories/IRecommendationParamsRepository';
import { RecommendationType, UserConditions } from '../types/common';
import { IdGenerator } from '../utils/idGenerator';

export interface PrepareRecommendationRequest {
  userId: string;
  type: RecommendationType;
  gameCount?: number;
  conditions?: UserConditions;
  round?: number;
}

export interface PrepareRecommendationResponse {
  paramId: string;
  type: RecommendationType;
  gameCount: number;
  expiresAt: string;
  message: string;
}

export class PrepareRecommendationUseCase {
  constructor(
    private readonly paramsRepository: IRecommendationParamsRepository,
  ) {}

  async execute(request: PrepareRecommendationRequest): Promise<PrepareRecommendationResponse> {
    // 1. 입력 검증
    this.validateRequest(request);

    // 2. 무료 추천은 이 과정을 거치지 않음
    if (request.type === RecommendationType.FREE) {
      throw new Error('무료 추천은 직접 생성하세요.');
    }

    // 3. 게임수 기본값 설정
    const gameCount = request.gameCount || 5;
    if (gameCount < 1 || gameCount > 10) {
      throw new Error('게임수는 1-10 사이여야 합니다.');
    }

    // 4. 추천 파라미터 엔티티 생성
    const id = IdGenerator.generateRecommendationParamId();
    const params = RecommendationParams.create(
      id,
      request.userId,
      request.type,
      gameCount,
      request.conditions,
      request.round,
    );

    // 5. 검증
    params.validate();

    // 6. 데이터베이스 저장
    const savedParams = await this.paramsRepository.create(params);

    // 7. 응답 생성
    return {
      paramId: savedParams.id,
      type: savedParams.type,
      gameCount: savedParams.gameCount,
      expiresAt: savedParams.expiresAt.toISOString(),
      message: '추천 파라미터가 저장되었습니다. 결제를 진행해주세요.',
    };
  }

  private validateRequest(request: PrepareRecommendationRequest): void {
    if (!request.userId || request.userId.trim() === '') {
      throw new Error('사용자 ID는 필수입니다.');
    }

    if (!request.type) {
      throw new Error('추천 타입은 필수입니다.');
    }

    if (!Object.values(RecommendationType).includes(request.type)) {
      throw new Error('올바르지 않은 추천 타입입니다.');
    }

    if (request.round && (request.round < 1 || request.round > 9999)) {
      throw new Error('회차는 1-9999 사이여야 합니다.');
    }

    // 조건 검증
    if (request.conditions) {
      this.validateConditions(request.conditions);
    }
  }

  private validateConditions(conditions: UserConditions): void {
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
  }
} 