/**
 * 운세 세션 생성 UseCase
 */
import { PrismaClient } from '@prisma/client';
import { IdGenerator } from '../utils/idGenerator';
import { FortuneSession } from '../entities/FortuneSession';
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';
import { IHongsiCreditRepository } from '../repositories/IHongsiCreditRepository';
import { FortuneCategory, SessionMode, FortuneProductType } from '../types/fortune';
import { FortuneProductService } from '../services/FortuneProductService';
import { PaymentService } from '../services/PaymentService';
import { DocumentFortuneUseCase } from './DocumentFortuneUseCase';
import { CustomError } from '../middlewares/errorHandler';
import type { FortuneErrorCode } from '../types/fortune';

export interface CreateSessionParams {
  userId: string;
  category: FortuneCategory;
  formType?: string;         // ASK, DAILY, TRADITIONAL
  mode: SessionMode;
  userInput: string;
  userData?: Record<string, any>; // 구조화된 운세 데이터 (이름, 생년월일, 성별 등)
  paymentId?: string;        // 우리 DB의 Payment.id
  portOnePaymentId?: string; // PortOne에서 반환한 paymentId (로컬: 콜백에서 전달, 실운영: 웹훅에서 저장)
  useFreeHongsi?: boolean;   // 무료 홍시 사용 여부 (채팅형만)
}

export class CreateFortuneSessionUseCase {
  constructor(
    private readonly sessionRepository: IFortuneSessionRepository,
    private readonly hongsiCreditRepository: IHongsiCreditRepository,
    private readonly prisma: PrismaClient,
    private readonly productService: FortuneProductService,
    private readonly paymentService: PaymentService,
    private readonly documentUseCase: DocumentFortuneUseCase, // 문서 생성 UseCase 추가
  ) {}

  private async ensureCompletedPayment(params: {
    paymentId: string;
    userId: string;
    portOnePaymentId?: string;
  }): Promise<void> {
    const { paymentId, userId, portOnePaymentId } = params;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new Error('유효한 결제 정보가 없습니다.');
    }

    if (payment.order.userId !== userId) {
      throw new Error('결제 정보가 일치하지 않습니다.');
    }

    if (payment.status === 'PENDING') {
      if (!portOnePaymentId) {
        throw new Error('PortOne 결제 ID가 필요합니다. 결제를 완료해주세요.');
      }

      console.log(`[세션 생성] 결제 상태 단건 확인 시작: paymentId=${paymentId}, portOnePaymentId=${portOnePaymentId}`);
      const verifyResult = await this.paymentService.verifyAndUpdatePaymentStatus(paymentId, portOnePaymentId);

      if (!verifyResult.success || verifyResult.status !== 'COMPLETED') {
        console.warn(`[세션 생성] 결제 완료 미확정: paymentId=${paymentId}, status=${verifyResult.status}`);
        throw new Error(
          '결제가 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요. (프론트엔드에서 폴링 권장)',
        );
      }
    } else if (payment.status !== 'COMPLETED') {
      throw new Error('결제가 완료되지 않았거나 취소되었습니다.');
    }

    const updatedPayment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!updatedPayment || updatedPayment.status !== 'COMPLETED') {
      throw new Error('결제 상태 확인에 실패했습니다.');
    }

    console.log(`[세션 생성] 결제 상태 확인 완료: ${paymentId} -> COMPLETED`);
  }

  private async persistSessionLinks(paymentId: string, sessionId: string): Promise<void> {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });

      if (!payment?.order) return;

      const orderMetadata = (payment.order.metadata as any) || {};
      orderMetadata.sessionId = sessionId;

      await this.prisma.order.update({
        where: { id: payment.order.id },
        data: {
          metadata: orderMetadata,
        },
      });
      console.log(`[세션 생성] Order metadata에 sessionId 저장: orderId=${payment.order.id}, sessionId=${sessionId}`);
    } catch (orderError: any) {
      console.error(`[세션 생성] Order metadata 업데이트 실패: sessionId=${sessionId}`, orderError);
    }
  }

  private async ensurePendingPaymentDetail(params: {
    paymentId: string;
    sessionId: string;
    category: FortuneCategory;
  }): Promise<void> {
    const { paymentId, sessionId, category } = params;

    const existingPaymentDetail = await this.prisma.paymentDetail.findFirst({
      where: {
        paymentId,
        sessionId,
      },
      select: { id: true },
    });

    if (existingPaymentDetail) {
      await this.prisma.paymentDetail.update({
        where: { id: existingPaymentDetail.id },
        data: {
          sessionType: 'DOCUMENT',
          category,
          result: {
            generationStatus: 'PENDING',
            updatedAt: new Date().toISOString(),
          },
        },
      });
      return;
    }

    await this.prisma.paymentDetail.create({
      data: {
        paymentId,
        sessionId,
        sessionType: 'DOCUMENT',
        category,
        result: {
          generationStatus: 'PENDING',
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }

  private async markDocumentGenerationFailure(params: {
    paymentId: string;
    sessionId: string;
    error: unknown;
  }): Promise<void> {
    const { paymentId, sessionId, error } = params;
    const errorLike = error as {
      code?: string;
      status?: number;
      message?: string;
      cause?: {
        code?: string;
        status?: number;
        message?: string;
      };
    };

    const rawErrorCode =
      errorLike.code || errorLike.cause?.code;
    const errorCode =
      rawErrorCode === 'insufficient_quota'
        ? 'AI_QUOTA_EXCEEDED'
        : rawErrorCode ||
          (errorLike.status === 429 || errorLike.cause?.status === 429
            ? 'AI_QUOTA_EXCEEDED'
            : 'AI_GENERATION_FAILED');
    const errorMessage =
      errorLike.message ||
      errorLike.cause?.message ||
      '운세 리포트 생성에 실패했습니다.';

    const paymentDetail = await this.prisma.paymentDetail.findFirst({
      where: {
        paymentId,
        sessionId,
      },
      select: { id: true },
    });

    if (!paymentDetail) {
      return;
    }

    await this.prisma.paymentDetail.update({
      where: { id: paymentDetail.id },
      data: {
        result: {
          generationStatus: 'FAILED',
          errorCode,
          errorMessage,
          updatedAt: new Date().toISOString(),
        },
      },
    });
  }

  private async generateDocumentInBackground(params: {
    paymentId: string;
    sessionId: string;
    userId: string;
    category: FortuneCategory;
    userInput: string;
    userData?: Record<string, any>;
  }): Promise<void> {
    const { paymentId, sessionId, userId, category, userInput, userData } = params;

    try {
      console.log(`[세션 생성] 백그라운드 문서 생성 시작: sessionId=${sessionId}, category=${category}`);
      const { documentId } = await this.documentUseCase.execute(
        userId,
        category,
        userInput,
        userData,
      );

      console.log(`[세션 생성] 백그라운드 문서 생성 완료: sessionId=${sessionId}, documentId=${documentId}`);

      if (!documentId) return;

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });

      if (payment?.order) {
        const orderMetadata = (payment.order.metadata as any) || {};
        orderMetadata.documentId = documentId;
        orderMetadata.sessionId = sessionId;

        await this.prisma.order.update({
          where: { id: payment.order.id },
          data: {
            metadata: orderMetadata,
          },
        });
        console.log(`[세션 생성] Order metadata에 documentId 저장: orderId=${payment.order.id}, documentId=${documentId}`);
      }

      const existingPaymentDetail = await this.prisma.paymentDetail.findFirst({
        where: {
          paymentId,
          sessionId,
        },
      });

      if (existingPaymentDetail) {
        await this.prisma.paymentDetail.update({
          where: { id: existingPaymentDetail.id },
          data: {
            documentId,
            result: {
              generationStatus: 'COMPLETED',
              updatedAt: new Date().toISOString(),
            },
          },
        });
        console.log(`[세션 생성] PaymentDetail 업데이트: paymentDetailId=${existingPaymentDetail.id}, documentId=${documentId}`);
        return;
      }

      const documentForExpiry = await this.prisma.documentResult.findUnique({
        where: { id: documentId },
        select: { expiresAt: true },
      });

      await this.prisma.paymentDetail.create({
        data: {
          paymentId,
          sessionId,
          documentId,
          sessionType: 'DOCUMENT',
          category,
          expiredAt: documentForExpiry?.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          result: {
            generationStatus: 'COMPLETED',
            updatedAt: new Date().toISOString(),
          },
        },
      });
      console.log(`[세션 생성] PaymentDetail 생성: paymentId=${paymentId}, documentId=${documentId}`);
    } catch (error: any) {
      console.error(`[세션 생성] 백그라운드 문서 생성 실패: sessionId=${sessionId}`, error);
      await this.markDocumentGenerationFailure({ paymentId, sessionId, error });
      // 결과 조회 fallback이 남아 있으므로 여기서는 로그만 남긴다.
    }
  }

  private async getUserChatUsableUntil(userId: string): Promise<Date | null> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { chatUsableUntil: true },
    });
    return u?.chatUsableUntil ?? null;
  }

  private assertChatAccessOrThrow(chatUsableUntil: Date | null): Date {
    const now = new Date();
    if (!chatUsableUntil || chatUsableUntil.getTime() <= now.getTime()) {
      const p = this.productService.getChatEntitlementProduct(1);
      throw new CustomError(
        `채팅 이용 가능 시간이 없습니다. 1일 이용권은 ${p.finalAmount.toLocaleString()}원부터 구매할 수 있습니다.`,
        400,
        'CHAT_ACCOUNT_TIME_EXHAUSTED' as FortuneErrorCode,
        {
          requiresPayment: true,
          suggestedPass: {
            productType: FortuneProductType.CHAT_SESSION,
            productId: p.productId,
            chatEntitlementDays: 1,
            finalAmountWon: p.finalAmount,
          },
        },
      );
    }
    return chatUsableUntil;
  }

  private buildChatSession(
    userId: string,
    category: FortuneCategory,
    mode: SessionMode,
    until: Date,
    formType: any,
    userInput: string,
    userData?: Record<string, any>,
  ): FortuneSession {
    const sessionId = IdGenerator.generateFortuneSessionId();
    const seconds = Math.max(60, Math.floor((until.getTime() - Date.now()) / 1000));
    return FortuneSession.create(
      sessionId,
      userId,
      category,
      mode,
      seconds,
      formType,
      userInput,
      userData,
    );
  }

  async execute(params: CreateSessionParams): Promise<FortuneSession> {
    const { userId, category, formType, mode, userInput, userData, paymentId, portOnePaymentId, useFreeHongsi } = params;

    // 문서형은 무조건 결제 필수
    if (mode === SessionMode.DOCUMENT) {
      if (!paymentId) {
        const product = this.productService.getProduct(
          FortuneProductType.DOCUMENT_REPORT,
          category,
        );
        throw new Error(
          `문서형 리포트는 결제가 필수입니다. (${product.finalAmount.toLocaleString()}원)`,
        );
      }

      await this.ensureCompletedPayment({ paymentId, userId, portOnePaymentId });

      // 결제된 문서형 세션 생성 (시간 제한 없음, 문서 생성 후 종료)
      const sessionId = IdGenerator.generateFortuneSessionId();
      const session = FortuneSession.create(
        sessionId,
        userId,
        category,
        mode,
        0, // 문서형은 시간 개념 없음
        formType as any,
        userInput,
        userData,
      );

      session.validate();
      const createdSession = await this.sessionRepository.create(session);

      // Order의 metadata에 sessionId 저장 (세션과 주문 연결)
      if (paymentId) {
        await this.persistSessionLinks(paymentId, createdSession.id);
        await this.ensurePendingPaymentDetail({
          paymentId,
          sessionId: createdSession.id,
          category,
        });
      }

      // 체감 속도를 위해 문서 생성은 백그라운드에서 수행한다.
      if (paymentId) {
        void this.generateDocumentInBackground({
          paymentId,
          sessionId: createdSession.id,
          userId,
          category,
          userInput,
          userData,
        });
      }

      return createdSession;
    }

    // 채팅형: 계정 User.chatUsableUntil 기준 (결제 완료 시 PaymentService에서 이용권 연장)
    if (mode === SessionMode.CHAT) {
      const existingSession = await this.sessionRepository.findActiveByUserIdAndCategory(
        userId,
        category,
        SessionMode.CHAT,
      );

      if (existingSession && existingSession.isActive) {
        return existingSession;
      }

      let sessionToCreate: FortuneSession | null = null;

      if (paymentId) {
        await this.ensureCompletedPayment({ paymentId, userId, portOnePaymentId });

        const latestPayment = await this.prisma.payment.findUnique({
          where: { id: paymentId },
          include: { order: true },
        });
        if (!latestPayment?.order) {
          throw new Error('주문 정보를 찾을 수 없습니다.');
        }

        const meta = (latestPayment.order.metadata as Record<string, unknown>) || {};
        const rawEnt = meta.chatEntitlementDays as number | undefined;
        if (rawEnt !== 1 && rawEnt !== 7 && rawEnt !== 30) {
          throw new Error('채팅 결제 주문에 chatEntitlementDays(1·7·30)가 없습니다.');
        }

        const until = this.assertChatAccessOrThrow(await this.getUserChatUsableUntil(userId));
        sessionToCreate = this.buildChatSession(
          userId,
          category,
          mode,
          until,
          formType as any,
          userInput,
          userData,
        );
      } else if (useFreeHongsi) {
        const isFreeCategory = formType === 'ASK' || formType === 'DAILY';

        if (!isFreeCategory) {
          const isFreeUsed = await this.hongsiCreditRepository.isFreeHongsiUsedToday(userId);
          if (isFreeUsed) {
            throw new Error('오늘 무료 홍시를 이미 사용했습니다.');
          }
          await this.hongsiCreditRepository.useFreeHongsi(userId);
        }

        const until = this.assertChatAccessOrThrow(await this.getUserChatUsableUntil(userId));
        sessionToCreate = this.buildChatSession(
          userId,
          category,
          mode,
          until,
          formType as any,
          userInput,
          userData,
        );
      } else {
        const until = this.assertChatAccessOrThrow(await this.getUserChatUsableUntil(userId));
        sessionToCreate = this.buildChatSession(
          userId,
          category,
          mode,
          until,
          formType as any,
          userInput,
          userData,
        );
      }

      if (!sessionToCreate) {
        throw new Error('세션을 생성할 수 없습니다.');
      }
      sessionToCreate.validate();
      return await this.sessionRepository.create(sessionToCreate);
    }
    throw new Error('유효하지 않은 세션 모드입니다.');
  }
}
