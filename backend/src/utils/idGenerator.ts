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