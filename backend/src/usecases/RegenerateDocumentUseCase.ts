/**
 * 문서 재생성 UseCase
 * 기존 세션의 정보를 기반으로 문서를 재생성합니다.
 */
import { PrismaClient } from '@prisma/client';
import { DocumentFortuneUseCase } from './DocumentFortuneUseCase';
import { ResultTokenService } from '../services/ResultTokenService';
import { FortuneCategory, FormType, SessionMode } from '../types/fortune';

export interface RegenerateDocumentResult {
  resultToken: string;
  documentId: string;
  title: string;
  summary: string;
}

export class RegenerateDocumentUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly documentUseCase: DocumentFortuneUseCase,
    private readonly resultTokenService: ResultTokenService,
  ) {}

  async execute(
    userId: string,
    sessionId: string,
  ): Promise<RegenerateDocumentResult> {
    // 세션 조회
    const session = await this.prisma.fortuneSession.findFirst({
      where: {
        id: sessionId,
        userId, // 본인 세션만
        mode: SessionMode.DOCUMENT, // 문서형만
      },
    });

    if (!session) {
      throw new Error('세션을 찾을 수 없거나 문서형 세션이 아닙니다.');
    }

    // 결제 확인 (결제 완료된 세션만 재생성 가능)
    const paymentDetail = await this.prisma.paymentDetail.findFirst({
      where: {
        sessionId: session.id,
      },
      include: {
        session: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!paymentDetail) {
      throw new Error('결제 정보를 찾을 수 없습니다.');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentDetail.paymentId },
      include: { order: true },
    });

    if (
      !payment ||
      payment.status !== 'COMPLETED' ||
      payment.order.status !== 'PAID'
    ) {
      throw new Error('결제가 완료되지 않은 세션입니다.');
    }

    // 사용자 입력 확인
    if (!session.userInput) {
      throw new Error('세션에 사용자 입력 정보가 없습니다.');
    }

    // 문서 재생성
    const { documentResponse, documentId } = await this.documentUseCase.execute(
      userId,
      session.category as FortuneCategory,
      session.userInput,
      session.userData as Record<string, any> | undefined,
    );

    // 생성된 문서 ID로 조회
    if (!documentId) {
      throw new Error('문서 생성에 실패했습니다.');
    }
    
    const document = await this.prisma.documentResult.findUnique({
      where: {
        id: documentId,
      },
    });

    if (!document) {
      throw new Error('문서 생성에 실패했습니다.');
    }

    // resultToken 생성
    const resultToken = this.resultTokenService.sign({
      sessionId: session.id,
      userId,
      category: session.category as FortuneCategory,
      formType: (session.formType || 'TRADITIONAL') as FormType,
      mode: SessionMode.DOCUMENT,
    });

    return {
      resultToken,
      documentId: document.id,
      title: documentResponse.title,
      summary: documentResponse.summary,
    };
  }
}

