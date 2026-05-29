import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiResponse } from '../types/common';

// 커스텀 에러 응답 함수
const createLimitResponse = (message: string): ApiResponse => ({
  success: false,
  error: message,
  data: {
    retryAfter: '1분 후에 다시 시도해주세요.',
  },
  timestamp: new Date().toISOString(),
});

// 일반 API 요청 제한 (분당 60회)
export const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 60, // 최대 60회
  message: createLimitResponse('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json(createLimitResponse('API 요청 한도를 초과했습니다.'));
  },
});
