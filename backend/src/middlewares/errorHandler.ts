import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types/common';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class CustomError extends Error implements ApiError {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.name = 'CustomError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// 비즈니스 로직 오류
export class BusinessLogicError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'BUSINESS_LOGIC_ERROR', details);
    this.name = 'BusinessLogicError';
  }
}

// 리소스를 찾을 수 없음
export class NotFoundError extends CustomError {
  constructor(message: string = '요청한 리소스를 찾을 수 없습니다.') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

// 인증 오류
export class AuthenticationError extends CustomError {
  constructor(message: string = '인증이 필요합니다.') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

// 권한 오류
export class AuthorizationError extends CustomError {
  constructor(message: string = '권한이 없습니다.') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

// 외부 서비스 오류
export class ExternalServiceError extends CustomError {
  constructor(message: string, service: string, details?: any) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', { service, ...details });
    this.name = 'ExternalServiceError';
  }
}

// 데이터베이스 오류
export class DatabaseError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

// 이미지 처리 오류
export class ImageProcessingError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 400, 'IMAGE_PROCESSING_ERROR', details);
    this.name = 'ImageProcessingError';
  }
}

// GPT 서비스 오류
export class GPTServiceError extends CustomError {
  constructor(message: string, details?: any) {
    super(message, 503, 'GPT_SERVICE_ERROR', details);
    this.name = 'GPTServiceError';
  }
}

// 글로벌 에러 핸들러
export const globalErrorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error('API 오류 발생:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // 기본 상태 코드와 메시지 설정
  let statusCode = error.statusCode || 500;
  let message = error.message || '서버 내부 오류가 발생했습니다.';
  let code = error.code;
  let details = error.details;

  // 특정 오류 타입에 따른 처리
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = '입력 데이터 검증에 실패했습니다.';
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = '잘못된 데이터 형식입니다.';
    code = 'CAST_ERROR';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = '유효하지 않은 토큰입니다.';
    code = 'INVALID_TOKEN';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = '토큰이 만료되었습니다.';
    code = 'TOKEN_EXPIRED';
  } else if (error.name === 'MongoServerError' || error.name === 'PrismaClientKnownRequestError') {
    statusCode = 500;
    message = '데이터베이스 오류가 발생했습니다.';
    code = 'DATABASE_ERROR';
    details = process.env.NODE_ENV === 'development' ? error.details : undefined;
  } else if (error.name === 'ImageProcessingError') {
    statusCode = 400;
    code = 'IMAGE_PROCESSING_ERROR';
    // ImageProcessingError는 이미 상세한 메시지를 가지고 있음
    details = process.env.NODE_ENV === 'development' ? {
      originalError: error.message,
      stack: error.stack,
      ...error.details,
    } : undefined;
  }

  // 프로덕션 환경에서는 민감한 정보 숨기기
  if (process.env.NODE_ENV === 'production') {
    if (statusCode >= 500) {
      message = '서버 내부 오류가 발생했습니다.';
      details = undefined;
    }
    // ImageProcessingError는 프로덕션에서도 상세 메시지 유지 (사용자에게 유용)
  }

  const response: ApiResponse = {
    success: false,
    error: message,
    data: details ? { code, details } : code ? { code } : undefined,
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
};

// 404 핸들러
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: '요청한 엔드포인트를 찾을 수 없습니다.',
    data: {
      path: req.originalUrl,
      method: req.method,
    },
    timestamp: new Date().toISOString(),
  };
  
  res.status(404).json(response);
};

// 비동기 함수 에러 래퍼
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}; 