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
