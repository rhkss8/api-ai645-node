/**
 * 운세 서비스용 PaymentDetail 생성 UseCase
 * 실제 결제 완료 후 호출됨
 */
import { PrismaClient, SessionMode, FortuneCategory } from '@prisma/client';
import { CreatePaymentDetailUseCase } from './CreatePaymentDetailUseCase';
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';
import { IDocumentResultRepository } from '../repositories/IDocumentResultRepository';

export class CreatePaymentDetailForFortuneUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly sessionRepository: IFortuneSessionRepository,
    private readonly documentRepository: IDocumentResultRepository,
  ) {}

  /**
   * 결제 완료 후 PaymentDetail 생성
   * 
   * @param paymentId 결제 ID (Payment 테이블의 id)
   * @param sessionId 세션 ID (선택)
   * @param documentId 문서 ID (선택)
   * @param sessionType 세션 타입 (CHAT or DOCUMENT)
   * @param category 카테고리
   */
  async execute(data: {
    paymentId: string;
    sessionId?: string;
    documentId?: string;
    sessionType: SessionMode;
    category: FortuneCategory;
    result?: any;
  }): Promise<void> {
    // 세션이나 문서 정보 조회하여 만료 시간 계산
    let expiredAt: Date | undefined;

    if (data.sessionId) {
      const session = await this.sessionRepository.findById(data.sessionId);
      if (session) {
        expiredAt = session.expiresAt;
      }
    } else if (data.documentId) {
      const document = await this.documentRepository.findById(data.documentId);
      if (document) {
        expiredAt = document.expiresAt;
      }
    }

    const createPaymentDetailUseCase = new CreatePaymentDetailUseCase(this.prisma);
    await createPaymentDetailUseCase.execute({
      paymentId: data.paymentId,
      sessionId: data.sessionId,
      documentId: data.documentId,
      sessionType: data.sessionType,
      category: data.category,
      result: data.result,
      expiredAt,
    });
  }
}
