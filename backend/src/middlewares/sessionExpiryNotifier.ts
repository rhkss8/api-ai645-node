/**
 * 세션 만료 알림 미들웨어
 * 세션 조회 시 만료 임박 안내를 응답에 포함
 */
import { FortuneSession } from '../entities/FortuneSession';

export interface SessionExpiryInfo {
  remainingTime: number;
  isExpiringSoon: boolean; // 30초 이하
  isExpired: boolean;
  expiryWarning?: string;
}

/**
 * 세션 만료 상태 확인 및 알림 정보 생성
 */
export function checkSessionExpiry(session: FortuneSession): SessionExpiryInfo {
  const remainingTime = session.remainingTime;
  const isExpiringSoon = remainingTime > 0 && remainingTime <= 30;
  const isExpired = remainingTime <= 0 || session.expiresAt <= new Date();

  let expiryWarning: string | undefined;

  if (isExpired) {
    expiryWarning = '세션이 만료되었습니다. 홍시를 구매하여 새 세션을 시작해주세요.';
  } else if (isExpiringSoon) {
    expiryWarning = `남은 시간이 ${remainingTime}초입니다. 홍시를 구매하여 상담을 이어가세요!`;
  }

  return {
    remainingTime,
    isExpiringSoon,
    isExpired,
    expiryWarning,
  };
}
