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
        const request = {
          type: RecommendationType.FREE,
          round: req.body.round,
          conditions: req.body.conditions,
        };

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
        let requestData;
        let imageFile: UploadedFile | undefined;

        // multipart/form-data 처리
        if (req.file) {
          imageFile = {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            encoding: req.file.encoding,
            mimetype: req.file.mimetype,
            size: req.file.size,
            buffer: req.file.buffer,
          };

          // data 필드에서 JSON 파싱
          try {
            requestData = req.body.data ? JSON.parse(req.body.data) : {};
          } catch (parseError) {
            throw new BusinessLogicError('잘못된 JSON 형식입니다.');
          }
        } else {
          // 일반 JSON 요청
          requestData = req.body;
        }

        const request = {
          type: RecommendationType.PREMIUM,
          round: requestData.round,
          conditions: requestData.conditions,
          image: imageFile,
        };

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