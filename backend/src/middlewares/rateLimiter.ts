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

// 무료 추천 API 제한 (분당 10회)
export const freeRecommendationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 10, // 최대 10회
  message: createLimitResponse('무료 추천 요청이 너무 많습니다. 1분 후에 다시 시도해주세요.'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // IP와 User-Agent 조합으로 키 생성
    return `free_rec_${req.ip}_${req.get('User-Agent')}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json(createLimitResponse('무료 추천 요청 한도를 초과했습니다. 프리미엄을 이용해보세요.'));
  },
});

// 프리미엄 추천 API 제한 (분당 5회)
export const premiumRecommendationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 5, // 최대 5회
  message: createLimitResponse('프리미엄 추천 요청이 너무 많습니다. 1분 후에 다시 시도해주세요.'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return `premium_rec_${req.ip}_${req.get('User-Agent')}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json(createLimitResponse('프리미엄 추천 요청 한도를 초과했습니다.'));
  },
});

// 이미지 추출 API 제한 (분당 3회)
export const imageExtractionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 3, // 최대 3회
  message: createLimitResponse('이미지 분석 요청이 너무 많습니다. 1분 후에 다시 시도해주세요.'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return `image_extract_${req.ip}_${req.get('User-Agent')}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json(createLimitResponse('이미지 분석 요청 한도를 초과했습니다.'));
  },
});

// 회고 생성 API 제한 (분당 5회)
export const reviewGenerationLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 5, // 최대 5회
  message: createLimitResponse('회고 생성 요청이 너무 많습니다. 1분 후에 다시 시도해주세요.'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return `review_gen_${req.ip}_${req.get('User-Agent')}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json(createLimitResponse('회고 생성 요청 한도를 초과했습니다.'));
  },
});

// 관리자 API 제한 (시간당 100회)
export const adminLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 100, // 최대 100회
  message: createLimitResponse('관리자 API 요청이 너무 많습니다. 1시간 후에 다시 시도해주세요.'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return `admin_${req.ip}_${req.get('User-Agent')}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json(createLimitResponse('관리자 API 요청 한도를 초과했습니다.'));
  },
});

// 데이터 조회 API 제한 (분당 30회)
export const dataQueryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 30, // 최대 30회
  message: createLimitResponse('데이터 조회 요청이 너무 많습니다. 1분 후에 다시 시도해주세요.'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return `data_query_${req.ip}_${req.get('User-Agent')}`;
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json(createLimitResponse('데이터 조회 요청 한도를 초과했습니다.'));
  },
});

// 엄격한 제한 (테스트용 또는 특별한 경우)
export const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1분
  max: 1, // 최대 1회
  message: createLimitResponse('이 API는 분당 1회만 호출 가능합니다.'),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json(createLimitResponse('API 호출 빈도가 너무 높습니다.'));
  },
}); 