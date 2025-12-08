import { randomBytes } from 'crypto';

export class IdGenerator {
  /**
   * CUID-like ID 생성 (Collision-resistant Unique Identifier)
   */
  static generateCuid(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes(8).toString('base64url');
    return `c${timestamp}${randomPart}`;
  }

  /**
   * 추천 ID 생성
   */
  static generateRecommendationId(): string {
    return `rec_${this.generateShortId()}`;
  }

  /**
   * 추천 파라미터 ID 생성
   */
  static generateRecommendationParamId(): string {
    return `param_${this.generateShortId()}`;
  }

  /**
   * 회고 ID 생성
   */
  static generateReviewId(): string {
    return `review_${this.generateShortId()}`;
  }

  /**
   * 당첨번호 ID 생성
   */
  static generateWinningNumbersId(): string {
    return `win_${this.generateShortId()}`;
  }

  /**
   * API 사용량 ID 생성
   */
  static generateApiUsageId(): string {
    return `usage_${this.generateShortId()}`;
  }

  /**
   * IP 제한 기록 ID 생성
   */
  static generateIPLimitId(): string {
    return `ip_${this.generateShortId()}`;
  }

  /**
   * 운세 세션 ID 생성
   */
  static generateFortuneSessionId(): string {
    return `session_${this.generateShortId()}`;
  }

  /**
   * 대화 로그 ID 생성
   */
  static generateConversationLogId(): string {
    return `log_${this.generateShortId()}`;
  }

  /**
   * 문서 결과 ID 생성
   */
  static generateDocumentResultId(): string {
    return `doc_${this.generateShortId()}`;
  }

  /**
   * 외부 연동용 레퍼런스 ID 생성
   * (특수문자 없이 prefix + timestamp + random 형식)
   */
  static generateReference(prefix: string): string {
    const sanitizedPrefix = prefix.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'REF';
    const timestamp = Date.now().toString();
    const random = randomBytes(4).toString('hex').toUpperCase();
    return `${sanitizedPrefix}${timestamp}${random}`;
  }

  /**
   * 짧은 ID 생성 (8자리)
   */
  private static generateShortId(): string {
    return randomBytes(6).toString('base64url');
  }

  /**
   * UUID v4 생성 (필요시)
   */
  static generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/**
 * merchant_uid 생성 (PortOne 형식)
 * 형식: AI645_{timestamp}_{random}
 */
export function generateMerchantUid(): string {
  return IdGenerator.generateReference('AI645');
}

/**
 * 주문 ID 생성
 */
export function generateOrderId(): string {
  return IdGenerator.generateReference('ORDER');
} 