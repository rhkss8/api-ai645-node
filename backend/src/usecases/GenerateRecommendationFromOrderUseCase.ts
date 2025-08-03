import { RecommendationHistory } from '../entities/RecommendationHistory';
import { RecommendationParams, RecommendationParamStatus } from '../entities/RecommendationParams';
import { IRecommendationHistoryRepository } from '../repositories/IRecommendationHistoryRepository';
import { IRecommendationParamsRepository } from '../repositories/IRecommendationParamsRepository';
import { IWinningNumbersRepository } from '../repositories/IWinningNumbersRepository';
import { IGPTService } from '../repositories/IGPTService';
import { RecommendationType, GPTModel, RecommendationResponse, ImageExtractResult } from '../types/common';
import { IdGenerator } from '../utils/idGenerator';

export interface GenerateFromOrderRequest {
  orderId: string;
  userId: string; // 권한 검증용
}

export class GenerateRecommendationFromOrderUseCase {
  constructor(
    private readonly paramsRepository: IRecommendationParamsRepository,
    private readonly recommendationRepository: IRecommendationHistoryRepository,
    private readonly winningNumbersRepository: IWinningNumbersRepository,
    private readonly gptService: IGPTService,
  ) {}

  async execute(request: GenerateFromOrderRequest): Promise<RecommendationResponse> {
    // 1. 주문에 연결된 추천 파라미터 조회
    const params = await this.paramsRepository.findByOrderId(request.orderId);
    if (!params) {
      throw new Error('해당 주문의 추천 파라미터를 찾을 수 없습니다.');
    }

    // 2. 사용자 권한 검증
    if (params.userId !== request.userId) {
      throw new Error('해당 주문에 대한 권한이 없습니다.');
    }

    // 3. 주문 상태 확인 및 파라미터 상태 자동 업데이트
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const order = await prisma.order.findUnique({
        where: { id: request.orderId }
      });

      if (!order) {
        throw new Error('주문을 찾을 수 없습니다.');
      }

      // 주문이 PENDING 상태이면 결제 완료로 간주하고 상태 업데이트
      if (order.status === 'PENDING') {
        console.log(`🔄 결제 완료 처리: 주문 ${request.orderId} - PENDING → PAID`);
        
        // 주문 상태를 PAID로 업데이트
        await prisma.order.update({
          where: { id: request.orderId },
          data: { status: 'PAID' }
        });
        
        // 파라미터 상태를 PAYMENT_COMPLETED로 업데이트
        await this.paramsRepository.updateStatus(params.id, RecommendationParamStatus.PAYMENT_COMPLETED);
        
        // 파라미터 객체 상태도 업데이트
        const updatedParams = await this.paramsRepository.findByOrderId(request.orderId);
        if (updatedParams) {
          Object.assign(params, updatedParams);
        }
        
        console.log(`✅ 주문 ${request.orderId} → PAID, 파라미터 ${params.id} → PAYMENT_COMPLETED 업데이트 완료`);
      }
      // 주문이 PAID 상태인데 파라미터가 PENDING이면 파라미터만 업데이트  
      else if (order.status === 'PAID' && params.status === RecommendationParamStatus.PENDING) {
        console.log(`🔄 파라미터 상태 동기화: 주문 ${request.orderId} - PENDING → PAYMENT_COMPLETED`);
        
        await this.paramsRepository.updateStatus(params.id, RecommendationParamStatus.PAYMENT_COMPLETED);
        
        // 파라미터 객체 상태도 업데이트
        const updatedParams = await this.paramsRepository.findByOrderId(request.orderId);
        if (updatedParams) {
          Object.assign(params, updatedParams);
        }
        
        console.log(`✅ 파라미터 ${params.id} 상태를 PAYMENT_COMPLETED로 업데이트 완료`);
      }
    } catch (error) {
      console.error('❌ 주문 상태 확인 중 오류:', error);
    } finally {
      await prisma.$disconnect();
    }

    // 4. 추천번호 생성 가능 상태인지 확인
    if (!params.canGenerateRecommendation()) {
      throw new Error(`현재 상태(${params.status})에서는 추천번호를 생성할 수 없습니다.`);
    }

    // 5. 이미 생성된 추천번호가 있는지 확인
    const existingRecommendation = await this.recommendationRepository.findByOrderId(request.orderId);
    if (existingRecommendation) {
      // 이미 생성된 추천번호 반환
      return this.toResponse(existingRecommendation, params.gameCount);
    }

    // 6. 파라미터 상태를 GENERATING으로 업데이트
    await this.updateParamsStatus(params, RecommendationParamStatus.GENERATING);

    try {
      // 7. 회차 자동 설정 (가장 최근 회차 + 1)
      let targetRound = params.round;
      if (!targetRound) {
        try {
          const latestRound = await this.winningNumbersRepository.getLatestRound();
          targetRound = latestRound + 1;
          console.log(`🎯 회차 자동 설정: 최근 회차 ${latestRound} → 추천 회차 ${targetRound}`);
        } catch (error) {
          console.warn('최근 회차 조회 실패, 기본값 1 사용:', error);
          targetRound = 1;
        }
      }

      // 8. 최근 당첨 번호 가져오기 (최근 10회차)
      let recentWinningNumbers: number[][] = [];
      try {
        const recentWinnings = await this.winningNumbersRepository.findRecent(10);
        recentWinningNumbers = recentWinnings.map(winning => {
          if (Array.isArray(winning.numbers)) {
            return winning.numbers;
          } else {
            console.warn(`Invalid winning numbers structure:`, winning.numbers);
            return [];
          }
        }).filter(numbers => numbers.length > 0);
        console.log(`🏆 최근 당첨 번호 ${recentWinningNumbers.length}회차 로드됨`);
      } catch (error) {
        console.warn('최근 당첨 번호 로드 실패:', error);
      }

                  // 9. 조건에 최근 당첨 번호 추가
            const enhancedConditions = {
              ...(params.conditions || {}),
              recentPurchases: recentWinningNumbers,
            };

      // 10. GPT 모델 선택 (프리미엄은 GPT-4o 사용)
      const gptModel = params.type === RecommendationType.PREMIUM ? GPTModel.GPT_4O : GPTModel.GPT_3_5_TURBO;

      // 11. 번호 추천 생성
      const gptResult = await this.gptService.generateRecommendation(
        gptModel,
        params.gameCount,
        enhancedConditions,
        targetRound,
        undefined, // 이미지 데이터는 이미 conditions.includeNumbers에 포함됨
        [], // 이전 회고는 일단 빈 배열
      );

      // 12. 추천 엔티티 생성 및 검증
      const id = IdGenerator.generateRecommendationId();
              const recommendation = RecommendationHistory.create(
          id,
          gptResult.numbers,
          params.type,
          gptModel,
          targetRound,
                  params.conditions || undefined,
        undefined, // imageData는 더 이상 저장하지 않음
          gptResult.analysis,
          params.userId,
          request.orderId, // 주문 ID 연결
        );

      recommendation.validate();

      // 13. 데이터베이스 저장
      const savedRecommendation = await this.recommendationRepository.create(recommendation);

      // 14. 파라미터 상태를 COMPLETED로 업데이트
      await this.updateParamsStatus(params, RecommendationParamStatus.COMPLETED);

      console.log('✅ 유료 추천번호 생성 완료:', savedRecommendation.id);

      // 15. 응답 변환
      return this.toResponse(savedRecommendation, params.gameCount, gptResult.analysis);

    } catch (error) {
      // 16. 실패 시 파라미터 상태를 FAILED로 업데이트
      await this.updateParamsStatus(params, RecommendationParamStatus.FAILED);
      console.error('❌ 유료 추천번호 생성 실패:', error);
      throw new Error('추천번호 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  }

  private async updateParamsStatus(params: RecommendationParams, status: RecommendationParamStatus): Promise<void> {
    try {
      const updatedParams = params.updateStatus(status);
      await this.paramsRepository.update(updatedParams);
    } catch (error) {
      console.warn('파라미터 상태 업데이트 실패:', error);
    }
  }

  private toResponse(recommendation: RecommendationHistory, gameCount: number, analysis?: string): RecommendationResponse {
    return {
      gameCount,
      numbers: recommendation.numbers as number[][],
      round: recommendation.round || undefined,
      analysis: analysis || recommendation.analysis || undefined,
    };
  }
} 