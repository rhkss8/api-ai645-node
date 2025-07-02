import { Request, Response } from 'express';
import { GenerateRecommendationUseCase } from '../usecases/GenerateRecommendationUseCase';
import { ExtractImageNumbersUseCase } from '../usecases/ExtractImageNumbersUseCase';
import { ApiResponse, RecommendationType, UploadedFile } from '../types/common';
import { asyncHandler } from '../middlewares/errorHandler';
import { BusinessLogicError, ImageProcessingError } from '../middlewares/errorHandler';

export class RecommendationController {
  constructor(
    private readonly generateRecommendationUseCase: GenerateRecommendationUseCase,
    private readonly extractImageNumbersUseCase: ExtractImageNumbersUseCase,
  ) {}

  /**
   * 무료 번호 추천 API
   */
  public generateFreeRecommendation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        // 디버깅: 요청 데이터 로깅
        console.log('🔍 무료 추천 요청 데이터:', JSON.stringify(req.body, null, 2));
        
        const request = {
          type: RecommendationType.FREE,
          round: req.body.round, // 프론트에서 전송한 round가 있으면 사용, 없으면 UseCase에서 자동 설정
          conditions: req.body.conditions,
          gameCount: req.body.gameCount, // gameCount 추가
        };

        console.log('🎯 무료 추천 처리할 데이터:', JSON.stringify(request, null, 2));

        const result = await this.generateRecommendationUseCase.execute(request);

        const response: ApiResponse = {
          success: true,
          data: result,
          message: '무료 번호 추천이 완료되었습니다.',
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        if (error instanceof Error) {
          throw new BusinessLogicError(error.message);
        }
        throw error;
      }
    },
  );

  /**
   * 프리미엄 번호 추천 API
   */
  public generatePremiumRecommendation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        const requestData = req.body;
        
        // 디버깅: 요청 데이터 로깅
        console.log('🔍 프리미엄 추천 요청 데이터:', JSON.stringify(requestData, null, 2));

        const request = {
          type: RecommendationType.PREMIUM,
          round: requestData.round, // 프론트에서 전송한 round가 있으면 사용, 없으면 UseCase에서 자동 설정
          conditions: requestData.conditions,
          imageNumbers: requestData.imageNumbers, // 이미지 분석 결과에서 추출된 번호들
          gameCount: requestData.gameCount, // gameCount 추가
        };

        console.log('🎯 프리미엄 추천 처리할 데이터:', JSON.stringify(request, null, 2));

        const result = await this.generateRecommendationUseCase.execute(request);

        const response: ApiResponse = {
          success: true,
          data: result,
          message: '프리미엄 번호 추천이 완료되었습니다.',
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        if (error instanceof Error) {
          throw new BusinessLogicError(error.message);
        }
        throw error;
      }
    },
  );

  /**
   * 이미지 번호 추출 API
   */
  public extractImageNumbers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        if (!req.file) {
          throw new ImageProcessingError('이미지 파일이 제공되지 않았습니다.');
        }

        const imageFile: UploadedFile = {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          encoding: req.file.encoding,
          mimetype: req.file.mimetype,
          size: req.file.size,
          buffer: req.file.buffer,
        };

        const result = await this.extractImageNumbersUseCase.execute(imageFile);

        const response: ApiResponse = {
          success: true,
          data: result,
          message: '이미지에서 번호 추출이 완료되었습니다.',
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        if (error instanceof Error) {
          throw new ImageProcessingError(error.message);
        }
        throw error;
      }
    },
  );
} 