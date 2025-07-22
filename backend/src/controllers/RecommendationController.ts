import { Request, Response } from 'express';
import { GenerateRecommendationUseCase } from '../usecases/GenerateRecommendationUseCase';
import { ExtractImageNumbersUseCase } from '../usecases/ExtractImageNumbersUseCase';
import { IPLimitService } from '../services/IPLimitService';
import { ApiResponse, RecommendationType, UploadedFile } from '../types/common';
import { asyncHandler } from '../middlewares/errorHandler';
import { BusinessLogicError, ImageProcessingError } from '../middlewares/errorHandler';

export class RecommendationController {
  constructor(
    private readonly generateRecommendationUseCase: GenerateRecommendationUseCase,
    private readonly extractImageNumbersUseCase: ExtractImageNumbersUseCase,
    private readonly ipLimitService: IPLimitService,
  ) {}

  /**
   * 클라이언트의 실제 IP 주소를 추출
   */
  private getClientIP(req: Request): string {
    const forwarded = req.get('X-Forwarded-For');
    const realIP = req.get('X-Real-IP');
    
    if (forwarded) {
      return forwarded.split(',')[0]?.trim() || 'unknown';
    }
    
    if (realIP) {
      return realIP;
    }
    
    return req.ip ?? 'unknown';
  }

  /**
   * 무료 번호 추천 API
   */
  public generateFreeRecommendation = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        // 디버깅: 요청 데이터 로깅
        console.log('🔍 무료 추천 요청 데이터:', JSON.stringify(req.body, null, 2));
        
        // 로그인된 사용자 정보 확인 (인증 미들웨어에서 이미 확인됨)
        const user = (req as any).user;
        console.log(`👤 무료 추천 요청 - 사용자: ${user?.sub} (${user?.nickname})`);
        
        const request = {
          type: RecommendationType.FREE,
          round: req.body.round, // 프론트에서 전송한 round가 있으면 사용, 없으면 UseCase에서 자동 설정
          conditions: req.body.conditions,
          gameCount: req.body.gameCount, // gameCount 추가
          userId: user?.sub, // 로그인된 사용자 ID
        };

        console.log('🎯 무료 추천 처리할 데이터:', JSON.stringify(request, null, 2));

        const result = await this.generateRecommendationUseCase.execute(request);

        // 추천 성공 후 IP 제한 기록
        try {
          const clientIP = this.getClientIP(req);
          await this.ipLimitService.recordRequest(clientIP);
          console.log(`[IP제한] 무료 추천 성공 - IP: ${clientIP} 제한 기록 완료`);
        } catch (ipError) {
          console.error('[IP제한] 무료 추천 성공 후 IP 제한 기록 실패:', ipError);
          // IP 제한 기록 실패해도 추천 결과는 반환
        }

        const response: ApiResponse = {
          success: true,
          data: {
            ...result,
            userInfo: {
              userId: user?.sub,
              nickname: user?.nickname,
              message: '무료 추천이 완료되었습니다. 프리미엄 추천도 이용 가능합니다.',
            },
          },
          message: '무료 번호 추천이 완료되었습니다.',
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        const err = error as Error;
        // 이미 커스텀 에러인 경우 그대로 전달
        if (err instanceof BusinessLogicError || 
            err instanceof ImageProcessingError ||
            err.name === 'BusinessLogicError' ||
            err.name === 'ImageProcessingError') {
          throw err;
        }
        // GPT 서비스 관련 오류
        if (
          err.message.includes('OpenAI') ||
          err.message.includes('GPT') ||
          err.message.includes('API key') ||
          err.message.includes('rate limit')
        ) {
          throw new Error('AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
        // 데이터베이스 관련 오류
        if (
          err.message.includes('database') ||
          err.message.includes('connection') ||
          err.message.includes('Prisma')
        ) {
          throw new Error('데이터 저장에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
        // 기타 예상치 못한 오류
        console.error('무료 추천 API 예상치 못한 오류:', err);
        throw new Error('번호 추천 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
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

        // 로그인된 사용자 정보 확인 (인증 미들웨어에서 이미 확인됨)
        const user = (req as any).user;
        console.log(`👤 프리미엄 추천 요청 - 사용자: ${user?.sub} (${user?.nickname})`);

        const request = {
          type: RecommendationType.PREMIUM,
          round: requestData.round, // 프론트에서 전송한 round가 있으면 사용, 없으면 UseCase에서 자동 설정
          conditions: requestData.conditions,
          imageNumbers: requestData.imageNumbers, // 이미지 분석 결과에서 추출된 번호들
          gameCount: requestData.gameCount, // gameCount 추가
          userId: user?.sub, // 로그인된 사용자 ID
        };

        console.log('🎯 프리미엄 추천 처리할 데이터:', JSON.stringify(request, null, 2));

        const result = await this.generateRecommendationUseCase.execute(request);

        const response: ApiResponse = {
          success: true,
          data: {
            ...result,
            userInfo: {
              userId: user?.sub,
              nickname: user?.nickname,
              message: '프리미엄 추천이 완료되었습니다.',
            },
          },
          message: '프리미엄 번호 추천이 완료되었습니다.',
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error) {
        const err = error as Error;
        // 이미 커스텀 에러인 경우 그대로 전달
        if (err instanceof BusinessLogicError || 
            err instanceof ImageProcessingError ||
            err.name === 'BusinessLogicError' ||
            err.name === 'ImageProcessingError') {
          throw err;
        }
        // GPT 서비스 관련 오류
        if (
          err.message.includes('OpenAI') ||
          err.message.includes('GPT') ||
          err.message.includes('API key') ||
          err.message.includes('rate limit')
        ) {
          throw new Error('AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
        // 데이터베이스 관련 오류
        if (
          err.message.includes('database') ||
          err.message.includes('connection') ||
          err.message.includes('Prisma')
        ) {
          throw new Error('데이터 저장에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
        // 기타 예상치 못한 오류
        console.error('무료 추천 API 예상치 못한 오류:', err);
        throw new Error('번호 추천 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
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