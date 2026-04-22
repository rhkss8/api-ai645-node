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
  const now = new Date();
  const remainingTime = session.chatEntitlementExpiresAt
    ? Math.max(
        0,
        Math.floor(
          (session.chatEntitlementExpiresAt.getTime() - now.getTime()) / 1000,
        ),
      )
    : session.remainingTime;
  const isExpiringSoon = remainingTime > 0 && remainingTime <= 30;
  const isExpired = session.chatEntitlementExpiresAt
    ? session.chatEntitlementExpiresAt <= now || !session.isActive
    : remainingTime <= 0 || session.expiresAt <= now;

  let expiryWarning: string | undefined;

  if (isExpired) {
    // 세션 모드에 따라 다른 메시지 (CHAT: 상담권, DOCUMENT: 운세리포트)
    if (session.mode === 'CHAT') {
      expiryWarning = '세션이 만료되었습니다. 상담권을 구매하여 새 세션을 시작해주세요.';
    } else {
      expiryWarning = '세션이 만료되었습니다. 운세리포트를 구매하여 결과를 확인해주세요.';
    }
  } else if (isExpiringSoon) {
    if (session.mode === 'CHAT') {
      expiryWarning = `남은 시간이 ${remainingTime}초입니다. 상담권을 구매하여 상담을 이어가세요!`;
    } else {
      expiryWarning = `남은 시간이 ${remainingTime}초입니다. 운세리포트를 구매하여 결과를 확인해주세요.`;
    }
  }

  return {
    remainingTime,
    isExpiringSoon,
    isExpired,
    expiryWarning,
  };
}
