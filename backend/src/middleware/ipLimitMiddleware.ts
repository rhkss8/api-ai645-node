import { Request, Response, NextFunction } from 'express';
import { IPLimitService } from '../services/IPLimitService';

/**
 * 클라이언트의 실제 IP 주소를 추출
 */
function getClientIP(req: Request): string {
  // Proxy, Load Balancer 등을 고려한 IP 추출
  const forwarded = req.get('X-Forwarded-For');
  const realIP = req.get('X-Real-IP');
  
  if (forwarded) {
    // X-Forwarded-For: client, proxy1, proxy2
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  
  if (realIP) {
    return realIP;
  }
  
  // req.ip가 undefined일 수 있음을 명시적으로 처리
  return req.ip ?? 'unknown';
}

/**
 * 무료 추천 API용 IP 제한 미들웨어
 * 하루에 한 번만 요청 허용
 */
export const freeRecommendationIPLimit = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const clientIP = getClientIP(req);
    const ipLimitService = IPLimitService.getInstance();

    console.log(`[IP제한] 무료 추천 요청 - IP: ${clientIP}`);

    // IP 요청 가능 여부 확인
    if (!ipLimitService.canMakeRequest(clientIP)) {
      const nextAllowedTime = ipLimitService.getNextAllowedTime(clientIP);
      const remainingHours = Math.ceil(
        (nextAllowedTime.getTime() - new Date().getTime()) / (1000 * 60 * 60)
      );

      console.log(`[IP제한] 요청 제한됨 - IP: ${clientIP}, 다음 가능 시간: ${nextAllowedTime.toISOString()}`);

      res.status(429).json({
        success: false,
        error: '일일 무료 추천 한도를 초과했습니다.',
        message: `무료 추천은 하루에 한 번만 가능합니다. ${remainingHours}시간 후에 다시 시도해주세요.`,
        data: {
          nextAllowedTime: nextAllowedTime.toISOString(),
          remainingHours: remainingHours,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 요청 기록
    ipLimitService.recordRequest(clientIP);
    
    const remainingRequests = ipLimitService.getRemainingRequests(clientIP);
    console.log(`[IP제한] 요청 허용됨 - IP: ${clientIP}, 남은 횟수: ${remainingRequests}`);

    // 응답 헤더에 제한 정보 추가
    res.set({
      'X-RateLimit-Limit': '1',
      'X-RateLimit-Remaining': remainingRequests.toString(),
      'X-RateLimit-Reset': ipLimitService.getNextAllowedTime(clientIP).toISOString(),
    });

    next();
  } catch (error) {
    console.error('[IP제한] 미들웨어 오류:', error);
    
    // IP 제한 오류 시에도 요청을 허용 (서비스 연속성)
    res.status(500).json({
      success: false,
      error: 'IP 제한 처리 중 오류가 발생했습니다.',
      message: '일시적인 오류입니다. 잠시 후 다시 시도해주세요.',
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * 개발/테스트용: IP 제한 초기화 미들웨어
 */
export const resetIPLimits = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.NODE_ENV === 'development') {
    const ipLimitService = IPLimitService.getInstance();
    ipLimitService.clearAllRecords();
    console.log('[IP제한] 개발 모드: 모든 IP 제한이 초기화되었습니다.');
  }
  next();
}; 