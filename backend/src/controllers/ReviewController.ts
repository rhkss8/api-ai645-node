import { Request, Response } from 'express';
import { GenerateReviewUseCase } from '../usecases/GenerateReviewUseCase';
import { IRecommendationReviewRepository } from '../repositories/IRecommendationReviewRepository';
import { ApiResponse, PaginatedResponse } from '../types/common';
import { asyncHandler } from '../middlewares/errorHandler';
import { BusinessLogicError, NotFoundError } from '../middlewares/errorHandler';

export class ReviewController {
  constructor(
    private readonly generateReviewUseCase: GenerateReviewUseCase,
    private readonly reviewRepository: IRecommendationReviewRepository,
  ) {}

  /**
   * 회고 생성 API
   */
  public generateReview = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const request = {
          recommendationId: req.body.recommendationId,
          winningNumbers: req.body.winningNumbers,
        };

        const result = await this.generateReviewUseCase.execute(request);

        const response: ApiResponse = {
          success: true,
          data: result,
          message: '회고 분석이 완료되었습니다.',
          timestamp: new Date().toISOString(),
        };

        res.status(201).json(response);
      } catch (error) {
        if (error instanceof Error) {
          throw new BusinessLogicError(error.message);
        }
        throw error;
      }
    },
  );

  /**
   * 특정 회고 조회 API
   */
  public getReviewById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { id } = req.params;
        
        if (!id) {
          throw new BusinessLogicError('ID 파라미터가 필요합니다.');
        }
        
        const review = await this.reviewRepository.findById(id);
        if (!review) {
          throw new NotFoundError('회고를 찾을 수 없습니다.');
        }

        const response: ApiResponse = {
          success: true,
          data: {
            id: review.id,
            recommendationId: review.recommendationId,
            winningNumbers: review.winningNumbers,
            matchedCounts: review.matchedCounts,
            reviewText: review.reviewText,
            analysisPrompt: review.analysisPrompt,
            createdAt: review.createdAt.toISOString(),
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
   * 추천별 회고 목록 조회 API
   */
  public getReviewsByRecommendationId = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const { recommendationId } = req.params;
        
        if (!recommendationId) {
          throw new BusinessLogicError('추천 ID 파라미터가 필요합니다.');
        }
        
        const reviews = await this.reviewRepository.findByRecommendationId(recommendationId);

        const response: ApiResponse = {
          success: true,
          data: reviews.map(review => ({
            id: review.id,
            recommendationId: review.recommendationId,
            winningNumbers: review.winningNumbers,
            matchedCounts: review.matchedCounts,
            reviewText: review.reviewText,
            analysisPrompt: review.analysisPrompt,
            createdAt: review.createdAt.toISOString(),
          })),
          message: `추천 ID ${recommendationId}에 대한 회고 목록입니다.`,
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        throw error;
      }
    },
  );

  /**
   * 최근 회고 목록 조회 API
   */
  public getRecentReviews = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const limit = parseInt(req.query.limit as string) || 10;
        
        if (limit > 50) {
          throw new BusinessLogicError('한 번에 최대 50개까지만 조회 가능합니다.');
        }

        const reviews = await this.reviewRepository.findRecent(limit);

        const response: ApiResponse = {
          success: true,
          data: reviews.map(review => ({
            id: review.id,
            recommendationId: review.recommendationId,
            winningNumbers: review.winningNumbers,
            matchedCounts: review.matchedCounts,
            reviewText: review.reviewText,
            analysisPrompt: review.analysisPrompt,
            createdAt: review.createdAt.toISOString(),
          })),
          message: `최근 ${reviews.length}개의 회고입니다.`,
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        throw error;
      }
    },
  );

  /**
   * 회고 목록 조회 (페이지네이션) API
   */
  public getReviews = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await this.reviewRepository.findAll(page, limit);
        const totalPages = Math.ceil(result.total / limit);

        const response: PaginatedResponse<any> = {
          success: true,
          data: result.data.map(review => ({
            id: review.id,
            recommendationId: review.recommendationId,
            winningNumbers: review.winningNumbers,
            matchedCounts: review.matchedCounts,
            reviewText: review.reviewText,
            analysisPrompt: review.analysisPrompt,
            createdAt: review.createdAt.toISOString(),
          })),
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages,
          },
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        throw error;
      }
    },
  );
} 