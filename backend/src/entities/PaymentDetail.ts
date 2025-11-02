/**
 * PaymentDetail 엔티티
 */
import { SessionMode, FortuneCategory } from '../types/fortune';

export class PaymentDetail {
  constructor(
    public readonly id: string,
    public readonly paymentId: string,
    public readonly sessionId?: string,
    public readonly documentId?: string,
    public readonly sessionType: SessionMode,
    public readonly category: FortuneCategory,
    public readonly result?: any,
    public readonly createdAt: Date,
    public readonly expiredAt?: Date,
  ) {}

  static create(
    id: string,
    paymentId: string,
    sessionType: SessionMode,
    category: FortuneCategory,
    sessionId?: string,
    documentId?: string,
    result?: any,
    expiredAt?: Date,
  ): PaymentDetail {
    return new PaymentDetail(
      id,
      paymentId,
      sessionId,
      documentId,
      sessionType,
      category,
      result,
      new Date(),
      expiredAt,
    );
  }

  validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('PaymentDetail ID는 필수입니다.');
    }
    if (!this.paymentId || this.paymentId.trim().length === 0) {
      throw new Error('Payment ID는 필수입니다.');
    }
    if (!this.sessionId && !this.documentId) {
      throw new Error('Session ID 또는 Document ID 중 하나는 필수입니다.');
    }
  }
}
