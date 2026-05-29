/**
 * 운세 결제 내역 상세 조회 UseCase
 * 특정 결제 내역의 상세 정보를 조회합니다.
 */
import { PrismaClient } from '@prisma/client';
import { ResultTokenService } from '../services/ResultTokenService';
import { PaymentHistoryItem, getDisplayPaymentStatus, getPayMethodDisplay } from './GetFortunePaymentsUseCase';

export class GetFortunePaymentDetailUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly resultTokenService: ResultTokenService,
  ) {}

  async execute(userId: string, orderId: string): Promise<PaymentHistoryItem | null> {
    // 주문 조회
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId, // 본인 주문만 조회
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return null;
    }

    const metadata = order.metadata as any;
    const sessionId = metadata?.sessionId;
    let paymentDetail: {
      documentId?: string | null;
      session?: {
        id: string;
        category: string;
        formType: string | null;
        mode: string;
        remainingTime: number;
        isActive: boolean;
        expiresAt: Date;
        userInput: string | null;
        userData: unknown;
      } | null;
    } | null = null;

    // 세션 정보 조회
    let session: any = null;
    if (sessionId) {
      session = await this.prisma.fortuneSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          category: true,
          formType: true,
          mode: true,
          remainingTime: true,
          isActive: true,
          expiresAt: true,
          userInput: true,
          userData: true,
        },
      });
    }

    // PaymentDetail 조회 (세션 정보가 없을 경우)
    if (order.payment) {
      paymentDetail = await this.prisma.paymentDetail.findFirst({
        where: { paymentId: order.payment.id },
        include: {
          session: {
            select: {
              id: true,
              category: true,
              formType: true,
              mode: true,
              remainingTime: true,
              isActive: true,
              expiresAt: true,
              userInput: true,
              userData: true,
            },
          },
        },
      });

      if (!session && paymentDetail?.session) {
        session = paymentDetail.session;
      }
    }

    // 결과 상태 확인
    let hasDocument = false;
    let documentId: string | null = null;
    let resultToken: string | null = null;
    let canRegenerate = false;

    if (session) {
      // resultToken 생성
      resultToken = this.resultTokenService.sign({
        sessionId: session.id,
        userId,
        category: session.category,
        formType: (session.formType || 'TRADITIONAL') as any,
        mode: session.mode,
      });

      // 문서형인 경우 문서 존재 여부 확인
      if (session.mode === 'DOCUMENT') {
        let document = null;

        if (paymentDetail?.documentId) {
          document = await this.prisma.documentResult.findUnique({
            where: { id: paymentDetail.documentId },
            select: { id: true },
          });
        }

        if (!document && metadata?.documentId) {
          document = await this.prisma.documentResult.findUnique({
            where: { id: metadata.documentId },
            select: { id: true },
          });
        }

        if (document) {
          hasDocument = true;
          documentId = document.id;
        } else {
          // 결제와 세션은 연결돼 있지만 linked document가 없을 때만 재생성 허용
          canRegenerate =
            order.status === 'PAID' &&
            order.payment?.status === 'COMPLETED';
        }
      }
    }

    const displayStatus = getDisplayPaymentStatus({
      orderStatus: order.status,
      paymentStatus: order.payment?.status,
    });

    return {
      id: order.id,
      merchantUid: order.merchantUid,
      orderName: order.orderName,
      amount: order.amount,
      status: displayStatus,
      payment: order.payment
        ? {
            status: order.payment.status,
            payMethod: order.payment.payMethod, // 원본 값 (card, kakao, toss 등)
            payMethodDisplay: getPayMethodDisplay(order.payment.payMethod), // 한글 표시명
            easyPayProvider: order.payment.easyPayProvider, // 간편결제 제공자
            paidAt: order.payment.paidAt,
          }
        : undefined,
      metadata: {
        sessionId: session?.id || metadata?.sessionId,
        category: session?.category || metadata?.category,
        formType: session?.formType || metadata?.formType,
        mode: session?.mode || metadata?.mode,
        productId: metadata?.productId,
        productType: metadata?.productType,
        duration: metadata?.duration,
      },
      session: session
        ? {
            id: session.id,
            category: session.category,
            formType: session.formType,
            mode: session.mode,
            remainingTime: session.remainingTime,
            isActive: session.isActive,
            expiresAt: session.expiresAt,
            userInput: session.userInput,
          }
        : undefined,
      result: {
        hasDocument,
        documentId,
        resultToken,
        canRegenerate,
      },
      createdAt: order.createdAt,
    };
  }
}
