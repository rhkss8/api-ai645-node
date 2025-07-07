import { Request, Response } from 'express';
import { IRecommendationHistoryRepository } from '../repositories/IRecommendationHistoryRepository';
import { IWinningNumbersRepository } from '../repositories/IWinningNumbersRepository';
import { IPLimitService } from '../services/IPLimitService';
import { ApiResponse, PaginatedResponse, RecommendationType, WinStatus } from '../types/common';
import { asyncHandler } from '../middlewares/errorHandler';
import { BusinessLogicError, NotFoundError } from '../middlewares/errorHandler';
import { LottoScheduler } from '../batch/LottoScheduler';
import { calculateWinStatus, getWinDetails } from '../utils/winStatusCalculator';

export class DataController {
  constructor(
    private readonly recommendationRepository: IRecommendationHistoryRepository,
    private readonly winningNumbersRepository: IWinningNumbersRepository,
    private readonly ipLimitService?: IPLimitService,
  ) {}

  /**
   * 특정 추천 조회 API
   */
  public getRecommendationById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params;
        
        if (!id) {
          throw new BusinessLogicError('ID 파라미터가 필요합니다.');
        }
        
        const recommendation = await this.recommendationRepository.findById(id);
        if (!recommendation) {
          throw new NotFoundError('추천 내역을 찾을 수 없습니다.');
        }

        // 해당 회차의 당첨번호 정보 가져오기
        const winningNumbers = recommendation.round 
          ? await this.winningNumbersRepository.findByRound(recommendation.round)
          : null;

        const response: ApiResponse = {
          success: true,
          data: {
            id: recommendation.id,
            type: recommendation.type,
            round: recommendation.round,
            numbers: recommendation.numbers,
            conditions: recommendation.conditions,
            imageData: recommendation.imageData,
            winningNumbers: winningNumbers ? {
              id: winningNumbers.id,
              round: winningNumbers.round,
              numbers: winningNumbers.numbers,
              bonusNumber: winningNumbers.bonusNumber,
              firstWinningAmount: winningNumbers.firstWinningAmount.toString(),
              drawDate: winningNumbers.drawDate.toISOString(),
            } : null,
            createdAt: recommendation.createdAt.toISOString(),
          },
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
          throw new NotFoundError(error.message);
        }
        throw error;
      }
    },
  );

  /**
   * 추천 목록 조회 (통합 API)
   * 파라미터로 다양한 조회 조건 지원
   */
  public getRecommendations = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const type = req.query.type as RecommendationType;
      const winStatus = req.query.winStatus as WinStatus;
      const round = req.query.round ? parseInt(req.query.round as string) : undefined;
      const recent = req.query.recent === 'true';

      // type 파라미터 검증
      if (type && !Object.values(RecommendationType).includes(type)) {
        throw new BusinessLogicError('유효하지 않은 추천 타입입니다.');
      }

      // winStatus 파라미터 검증
      if (winStatus && !Object.values(WinStatus).includes(winStatus)) {
        throw new BusinessLogicError('유효하지 않은 당첨상태입니다.');
      }

      // round 파라미터 검증
      if (round && (isNaN(round) || round < 1 || round > 9999)) {
        throw new BusinessLogicError('회차는 1-9999 사이의 숫자여야 합니다.');
      }

      // limit 검증 (recent 모드일 때)
      if (recent && limit > 50) {
        throw new BusinessLogicError('최근 조회 시 한 번에 최대 50개까지만 조회 가능합니다.');
      }

      let result: { data: any[]; total: number };

      // 조회 방식 결정
      if (round) {
        // 회차별 조회
        const recommendations = await this.recommendationRepository.findByRound(round);
        result = {
          data: recommendations,
          total: recommendations.length
        };
      } else if (recent) {
        // 최근 조회
        const recommendations = await this.recommendationRepository.findRecent(limit);
        result = {
          data: recommendations,
          total: recommendations.length
        };
      } else {
        // 일반 페이지네이션 조회
        result = await this.recommendationRepository.findAllWithFilters(page, limit, type);
      }

      // 각 추천에 해당 회차의 당첨번호 정보와 당첨상태 추가
      const recommendationsWithWinningNumbers = await Promise.all(
        result.data.map(async (recommendation) => {
          const winningNumbers = recommendation.round 
            ? await this.winningNumbersRepository.findByRound(recommendation.round)
            : null;

          const winDetails = getWinDetails(
            { numbers: recommendation.numbers },
            winningNumbers ? {
              numbers: winningNumbers.numbers,
              bonusNumber: winningNumbers.bonusNumber
            } : null
          );

          return {
            id: recommendation.id,
            type: recommendation.type,
            round: recommendation.round,
            numbers: recommendation.numbers,
            conditions: recommendation.conditions,
            imageData: recommendation.imageData,
            winningNumbers: winningNumbers ? {
              id: winningNumbers.id,
              round: winningNumbers.round,
              numbers: winningNumbers.numbers,
              bonusNumber: winningNumbers.bonusNumber,
              firstWinningAmount: winningNumbers.firstWinningAmount.toString(),
              drawDate: winningNumbers.drawDate.toISOString(),
            } : null,
            winStatus: winDetails.status,
            matchCounts: winDetails.matchCounts,
            maxMatchCount: winDetails.maxMatchCount,
            bestRank: winDetails.bestRank,
            createdAt: recommendation.createdAt.toISOString(),
          };
        })
      );

      // winStatus 필터링 (DB에서 필터링할 수 없으므로 메모리에서 필터링)
      let filteredRecommendations = recommendationsWithWinningNumbers;
      if (winStatus) {
        filteredRecommendations = recommendationsWithWinningNumbers.filter(
          rec => rec.winStatus === winStatus
        );
      }

      // 메시지 생성
      let message = '추천 이력 조회가 완료되었습니다.';
      if (round) {
        message = `${round}회차에 대한 추천 목록입니다.`;
      } else if (recent) {
        message = `최근 ${filteredRecommendations.length}개의 추천입니다.`;
      }

      const response: ApiResponse = {
        success: true,
        data: filteredRecommendations,
        message,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );



  /**
   * 최신 당첨번호 조회 API
   */
  public getLatestWinningNumbers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        let winningNumbers = await this.winningNumbersRepository.findLatest();
        
        if (!winningNumbers) {
          throw new NotFoundError('당첨번호 데이터가 없습니다.');
        }

        // drawDate가 오늘 기준 이전 날짜인지 확인
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정
        
        const drawDate = new Date(winningNumbers.drawDate);
        drawDate.setHours(0, 0, 0, 0); // 시간을 00:00:00으로 설정

        // drawDate가 오늘보다 이전이면 최신 회차 조회 시도
        if (drawDate < today) {
          try {
            console.log('최신 회차 조회 필요 - 배치 API 호출');
            
            // 내부적으로 배치 로직 실행
            const lottoScheduler = new LottoScheduler();
            await lottoScheduler.manualFetch();
            
            // 다시 최신 당첨번호 조회
            winningNumbers = await this.winningNumbersRepository.findLatest();
            
            if (winningNumbers) {
              console.log(`최신 회차 ${winningNumbers.round} 조회 완료`);
            }
          } catch (batchError) {
            console.error('배치 실행 중 오류:', batchError);
            // 배치 실패해도 기존 데이터로 응답
          }
        }

        // winningNumbers가 null일 수 있으므로 체크
        if (!winningNumbers) {
          throw new NotFoundError('당첨번호 데이터가 없습니다.');
        }

        const response: ApiResponse = {
          success: true,
          data: {
            id: winningNumbers.id,
            round: winningNumbers.round,
            numbers: winningNumbers.numbers,
            bonusNumber: winningNumbers.bonusNumber,
            firstWinningAmount: winningNumbers.firstWinningAmount.toString(),
            drawDate: winningNumbers.drawDate.toISOString(),
            createdAt: winningNumbers.createdAt.toISOString(),
          },
          message: '최신 당첨번호입니다.',
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        throw error;
      }
    },
  );

  /**
   * 회차별 당첨번호 조회 API
   */
  public getWinningNumbersByRound = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const roundParam = req.params.round;
        
        if (!roundParam) {
          throw new BusinessLogicError('회차 파라미터가 필요합니다.');
        }
        
        const round = parseInt(roundParam);
        
        if (isNaN(round) || round < 1 || round > 9999) {
          throw new BusinessLogicError('회차는 1-9999 사이의 숫자여야 합니다.');
        }

        const winningNumbers = await this.winningNumbersRepository.findByRound(round);
        
        if (!winningNumbers) {
          throw new NotFoundError(`${round}회차 당첨번호를 찾을 수 없습니다.`);
        }

        const response: ApiResponse = {
          success: true,
          data: {
            id: winningNumbers.id,
            round: winningNumbers.round,
            numbers: winningNumbers.numbers,
            bonusNumber: winningNumbers.bonusNumber,
            firstWinningAmount: winningNumbers.firstWinningAmount.toString(),
            drawDate: winningNumbers.drawDate.toISOString(),
            createdAt: winningNumbers.createdAt.toISOString(),
          },
          message: `${round}회차 당첨번호입니다.`,
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        throw error;
      }
    },
  );

  /**
   * 최근 당첨번호 목록 조회 API (페이징)
   */
  public getRecentWinningNumbers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        
        if (limit > 50) {
          throw new BusinessLogicError('한 번에 최대 50개까지만 조회 가능합니다.');
        }

        const result = await this.winningNumbersRepository.findAll(page, limit);
        const totalPages = Math.ceil(result.total / limit);

        const response: PaginatedResponse<any> = {
          success: true,
          data: result.data.map(wn => ({
            id: wn.id,
            round: wn.round,
            numbers: wn.numbers,
            bonusNumber: wn.bonusNumber,
            firstWinningAmount: wn.firstWinningAmount.toString(),
            drawDate: wn.drawDate.toISOString(),
            createdAt: wn.createdAt.toISOString(),
          })),
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages,
          },
          message: `최근 ${result.data.length}개의 당첨번호입니다.`,
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        throw error;
      }
    },
  );

  /**
   * 개발용: IP 제한 초기화
   */
  public resetIPLimits = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      if (process.env.NODE_ENV !== 'development') {
        res.status(403).json({
          success: false,
          error: '개발 환경에서만 사용 가능합니다.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (!this.ipLimitService) {
        res.status(500).json({
          success: false,
          error: 'IP 제한 서비스가 초기화되지 않았습니다.',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await this.ipLimitService.clearAllRecords();

      const response: ApiResponse = {
        success: true,
        message: '모든 IP 제한이 초기화되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );
} 