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
  ipLimitService: IPLimitService
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const clientIP = getClientIP(req);

      console.log(`[IP제한] 무료 추천 요청 - IP: ${clientIP}`);

      // IP가 오늘 요청 가능한지 확인 (기록하지 않고 체크만)
      const canRequest = await ipLimitService.canMakeRequest(clientIP);

      if (!canRequest) {
        // 한도 초과 시 에러 응답
        const nextAllowedTime = await ipLimitService.getNextAllowedTime(clientIP);
        const hoursUntilReset = Math.ceil((nextAllowedTime.getTime() - Date.now()) / (1000 * 60 * 60));

        res.status(429).json({
          success: false,
          error: '일일 무료 추천 한도를 초과했습니다.',
          message: `무료 추천은 하루에 한 번만 가능합니다. ${hoursUntilReset}시간 후에 다시 시도해주세요.`,
          data: {
            nextAllowedTime: nextAllowedTime.toISOString(),
            hoursUntilReset,
          }
        });
        return;
      }

      // 요청 기록하지 않고 체크만 완료
      console.log(`[IP제한] 무료 추천 허용 - IP: ${clientIP}, 체크 완료`);

      // 응답 헤더에 제한 정보 추가
      res.set({
        'X-RateLimit-Limit': '1',
        'X-RateLimit-Remaining': '1',
        'X-RateLimit-Reset': (await ipLimitService.getNextAllowedTime(clientIP)).toISOString(),
      });

      next();
    } catch (error) {
      console.error('[IP제한] 미들웨어 오류:', error);
      // 오류 시 요청 거부 (보안 강화)
      res.status(500).json({
        success: false,
        error: 'IP 제한 확인 중 오류가 발생했습니다.',
        message: '잠시 후 다시 시도해주세요.',
        data: {
          code: 'IP_LIMIT_ERROR',
        }
      });
      return;
    }
  };
};

/**
 * 개발/테스트용: IP 제한 초기화 미들웨어
 */
export const resetIPLimits = (
  ipLimitService: IPLimitService
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (process.env.NODE_ENV === 'development') {
      try {
        await ipLimitService.clearAllRecords();
        console.log('[IP제한] 개발 모드: 모든 IP 제한이 초기화되었습니다.');
      } catch (error) {
        console.error('[IP제한] 초기화 오류:', error);
      }
    }
    next();
  };
}; 