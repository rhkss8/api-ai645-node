import { Request, Response, NextFunction } from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { RecommendationType } from '../types/common';
import { ApiResponse } from '../types/common';

// 공통 에러 처리 미들웨어
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const response: ApiResponse = {
      success: false,
      error: '입력 데이터가 올바르지 않습니다.',
      data: {
        validationErrors: errors.array(),
      },
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }
  next();
};

// 무료 추천 요청 검증
export const validateFreeRecommendationRequest = [
  body('gameCount')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('게임수는 1-5 사이의 숫자여야 합니다.'),
  
  body('round')
    .optional()
    .isInt({ min: 1, max: 9999 })
    .withMessage('회차는 1-9999 사이의 숫자여야 합니다.'),
  
  body('conditions.excludeNumbers')
    .optional()
    .isArray({ max: 20 })
    .withMessage('제외할 번호는 최대 20개까지 배열로 입력해주세요.')
    .custom((numbers: number[]) => {
      if (!Array.isArray(numbers)) return true;
      return numbers.every(num => Number.isInteger(num) && num >= 1 && num <= 45);
    })
    .withMessage('제외할 번호는 1-45 사이의 숫자여야 합니다.'),
  
  body('conditions.includeNumbers')
    .optional()
    .isArray({ max: 6 })
    .withMessage('포함할 번호는 최대 6개까지 배열로 입력해주세요.')
    .custom((numbers: number[]) => {
      if (!Array.isArray(numbers)) return true;
      return numbers.every(num => Number.isInteger(num) && num >= 1 && num <= 45);
    })
    .withMessage('포함할 번호는 1-45 사이의 숫자여야 합니다.'),
  
  body('conditions.recentPurchases')
    .optional()
    .isArray({ max: 10 })
    .withMessage('최근 구매 이력은 최대 10개까지 가능합니다.')
    .custom((purchases: number[][]) => {
      if (!Array.isArray(purchases)) return true;
      return purchases.every(purchase => 
        Array.isArray(purchase) && 
        purchase.length === 6 &&
        purchase.every(num => Number.isInteger(num) && num >= 1 && num <= 45)
      );
    })
    .withMessage('각 구매 이력은 1-45 사이의 6개 숫자로 구성되어야 합니다.'),
  
  body('conditions.preferences')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('선호사항은 최대 500자까지 가능합니다.'),
  
  handleValidationErrors,
];

// 프리미엄 추천 요청 검증
export const validatePremiumRecommendationRequest = [
  body('gameCount')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('게임수는 1-10 사이의 숫자여야 합니다.'),
  
  body('round')
    .optional()
    .isInt({ min: 1, max: 9999 })
    .withMessage('회차는 1-9999 사이의 숫자여야 합니다.'),
  
  body('conditions.excludeNumbers')
    .optional()
    .isArray({ max: 20 })
    .withMessage('제외할 번호는 최대 20개까지 배열로 입력해주세요.')
    .custom((numbers: number[]) => {
      if (!Array.isArray(numbers)) return true;
      return numbers.every(num => Number.isInteger(num) && num >= 1 && num <= 45);
    })
    .withMessage('제외할 번호는 1-45 사이의 숫자여야 합니다.'),
  
  body('conditions.includeNumbers')
    .optional()
    .isArray({ max: 6 })
    .withMessage('포함할 번호는 최대 6개까지 배열로 입력해주세요.')
    .custom((numbers: number[]) => {
      if (!Array.isArray(numbers)) return true;
      return numbers.every(num => Number.isInteger(num) && num >= 1 && num <= 45);
    })
    .withMessage('포함할 번호는 1-45 사이의 숫자여야 합니다.'),
  
  body('conditions.preferences')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('선호사항은 최대 500자까지 가능합니다.'),
  
  handleValidationErrors,
];

// 회고 생성 요청 검증
export const validateReviewRequest = [
  body('recommendationId')
    .notEmpty()
    .withMessage('추천 ID는 필수입니다.')
    .isString()
    .withMessage('추천 ID는 문자열이어야 합니다.'),
  
  body('winningNumbers')
    .isArray({ min: 7, max: 7 })
    .withMessage('당첨번호는 정확히 7개여야 합니다.')
    .custom((numbers: number[]) => {
      if (!Array.isArray(numbers) || numbers.length !== 7) return false;
      
      // 숫자 유효성 검증
      const isValidNumbers = numbers.every(num => 
        Number.isInteger(num) && num >= 1 && num <= 45
      );
      
      // 중복 확인
      const uniqueNumbers = new Set(numbers);
      const hasNoDuplicates = uniqueNumbers.size === 7;
      
      return isValidNumbers && hasNoDuplicates;
    })
    .withMessage('당첨번호는 1-45 사이의 중복되지 않은 7개 숫자여야 합니다.'),
  
  handleValidationErrors,
];

// 당첨번호 추가 요청 검증 (관리자용)
export const validateWinningNumbersRequest = [
  body('round')
    .isInt({ min: 1, max: 9999 })
    .withMessage('회차는 1-9999 사이의 숫자여야 합니다.'),
  
  body('numbers')
    .isArray({ min: 7, max: 7 })
    .withMessage('당첨번호는 정확히 7개여야 합니다.')
    .custom((numbers: number[]) => {
      if (!Array.isArray(numbers) || numbers.length !== 7) return false;
      
      const isValidNumbers = numbers.every(num => 
        Number.isInteger(num) && num >= 1 && num <= 45
      );
      
      const uniqueNumbers = new Set(numbers);
      const hasNoDuplicates = uniqueNumbers.size === 7;
      
      return isValidNumbers && hasNoDuplicates;
    })
    .withMessage('당첨번호는 1-45 사이의 중복되지 않은 7개 숫자여야 합니다.'),
  
  body('drawDate')
    .isISO8601()
    .withMessage('추첨일은 올바른 ISO8601 형식이어야 합니다.')
    .custom((date: string) => {
      const drawDate = new Date(date);
      const now = new Date();
      return drawDate <= now;
    })
    .withMessage('추첨일은 미래일 수 없습니다.'),
  
  handleValidationErrors,
];

// 페이지네이션 파라미터 검증
export const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('페이지는 1 이상의 숫자여야 합니다.'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('페이지 크기는 1-100 사이의 숫자여야 합니다.'),
  
  handleValidationErrors,
];

// ID 파라미터 검증
export const validateIdParam = [
  param('id')
    .notEmpty()
    .withMessage('ID는 필수입니다.')
    .isString()
    .withMessage('ID는 문자열이어야 합니다.')
    .isLength({ min: 1, max: 100 })
    .withMessage('ID는 1-100자 사이여야 합니다.'),
  
  handleValidationErrors,
];

// 회차 파라미터 검증
export const validateRoundParam = [
  param('round')
    .isInt({ min: 1, max: 9999 })
    .withMessage('회차는 1-9999 사이의 숫자여야 합니다.'),
  
  handleValidationErrors,
];

// 이미지 파일 검증 미들웨어
export const validateImageFile = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.file) {
    const response: ApiResponse = {
      success: false,
      error: '이미지 파일이 제공되지 않았습니다.',
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const minSize = 1024; // 1KB

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    const response: ApiResponse = {
      success: false,
      error: '지원하지 않는 이미지 형식입니다. JPEG, PNG, WebP만 가능합니다.',
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  if (req.file.size > maxSize) {
    const response: ApiResponse = {
      success: false,
      error: '이미지 크기는 10MB 이하여야 합니다.',
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  if (req.file.size < minSize) {
    const response: ApiResponse = {
      success: false,
      error: '이미지가 너무 작습니다. 최소 1KB 이상이어야 합니다.',
      timestamp: new Date().toISOString(),
    };
    res.status(400).json(response);
    return;
  }

  next();
};

// 요청 타입 검증 헬퍼
export const validateRequestType = (type: string): boolean => {
  return Object.values(RecommendationType).includes(type as RecommendationType);
}; 