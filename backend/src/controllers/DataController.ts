import { Request, Response } from 'express';
import { IRecommendationHistoryRepository } from '../repositories/IRecommendationHistoryRepository';
import { IWinningNumbersRepository } from '../repositories/IWinningNumbersRepository';
import { IPLimitService } from '../services/IPLimitService';
import { ApiResponse, PaginatedResponse, RecommendationType } from '../types/common';
import { asyncHandler } from '../middlewares/errorHandler';
import { BusinessLogicError, NotFoundError } from '../middlewares/errorHandler';

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

        const response: ApiResponse = {
          success: true,
          data: {
            id: recommendation.id,
            type: recommendation.type,
            round: recommendation.round,
            numbers: recommendation.numbers,
            conditions: recommendation.conditions,
            imageData: recommendation.imageData,
            gptModel: recommendation.gptModel,
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
   * 추천 목록 조회 (페이지네이션) API
   */
  public getRecommendations = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.recommendationRepository.findAll(page, limit);

      const response: ApiResponse = {
        success: true,
        data: result.data,
        message: '추천 이력 조회가 완료되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * 회차별 추천 조회 API
   */
  public getRecommendationsByRound = asyncHandler(
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

        const recommendations = await this.recommendationRepository.findByRound(round);

        const response: ApiResponse = {
          success: true,
          data: recommendations.map(recommendation => ({
            id: recommendation.id,
            type: recommendation.type,
            round: recommendation.round,
            numbers: recommendation.numbers,
            conditions: recommendation.conditions,
            imageData: recommendation.imageData,
            gptModel: recommendation.gptModel,
            createdAt: recommendation.createdAt.toISOString(),
          })),
          message: `${round}회차에 대한 추천 목록입니다.`,
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        throw error;
      }
    },
  );

  /**
   * 최근 추천 목록 조회 API
   */
  public getRecentRecommendations = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const limit = parseInt(req.query.limit as string) || 10;
        
        if (limit > 50) {
          throw new BusinessLogicError('한 번에 최대 50개까지만 조회 가능합니다.');
        }

        const recommendations = await this.recommendationRepository.findRecent(limit);

        const response: ApiResponse = {
          success: true,
          data: recommendations.map(recommendation => ({
            id: recommendation.id,
            type: recommendation.type,
            round: recommendation.round,
            numbers: recommendation.numbers,
            conditions: recommendation.conditions,
            imageData: recommendation.imageData,
            gptModel: recommendation.gptModel,
            createdAt: recommendation.createdAt.toISOString(),
          })),
          message: `최근 ${recommendations.length}개의 추천입니다.`,
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        throw error;
      }
    },
  );

  /**
   * 최신 당첨번호 조회 API
   */
  public getLatestWinningNumbers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const winningNumbers = await this.winningNumbersRepository.findLatest();
        
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