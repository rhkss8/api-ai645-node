/**
 * PaymentDetail 생성 UseCase
 */
import { PrismaClient, SessionMode, FortuneCategory } from '@prisma/client';
import { PaymentDetail } from '../entities/PaymentDetail';

export class CreatePaymentDetailUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(data: {
    paymentId: string;
    sessionId?: string;
    documentId?: string;
    sessionType: SessionMode;
    category: FortuneCategory;
    result?: any;
    expiredAt?: Date;
  }): Promise<void> {
    await this.prisma.paymentDetail.create({
      data: {
        paymentId: data.paymentId,
        sessionId: data.sessionId || null,
        documentId: data.documentId || null,
        sessionType: data.sessionType as SessionMode,
        category: data.category as FortuneCategory,
        result: data.result || null,
        expiredAt: data.expiredAt || null,
      },
    });
  }
}
