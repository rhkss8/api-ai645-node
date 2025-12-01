/**
 * 운세 결제 내역 조회 UseCase
 * 사용자의 운세 관련 결제 내역을 조회합니다.
 */
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { FortuneCategory, SessionMode, FormType } from '../types/fortune';
import { ResultTokenService } from '../services/ResultTokenService';

export interface PaymentHistoryItem {
  id: string; // Order.id
  merchantUid: string;
  orderName: string;
  amount: number;
  status: OrderStatus;
  payment?: {
    status: PaymentStatus;
    payMethod?: string;
    paidAt?: Date | null;
  };
  metadata?: {
    sessionId?: string;
    category?: FortuneCategory;
    formType?: FormType;
    mode?: SessionMode;
    productId?: string;
    productType?: string;
    duration?: number;
  };
  session?: {
    id: string;
    category: FortuneCategory;
    formType: FormType | null;
    mode: SessionMode;
    remainingTime: number;
    isActive: boolean;
    expiresAt: Date;
    userInput?: string | null;
  };
  result?: {
    hasDocument: boolean;
    documentId?: string | null;
    resultToken?: string | null;
    canRegenerate: boolean; // 문서 재생성 가능 여부
  };
  createdAt: Date;
}

export interface GetPaymentsParams {
  userId: string;
  page?: number;
  limit?: number;
  status?: OrderStatus;
  category?: FortuneCategory;
  mode?: SessionMode;
}

export interface GetPaymentsResult {
  items: PaymentHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class GetFortunePaymentsUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly resultTokenService: ResultTokenService,
  ) {}

  async execute(params: GetPaymentsParams): Promise<GetPaymentsResult> {
    const { userId, page = 1, limit = 20, status, category, mode } = params;

    // 운세 관련 주문만 조회
    // 1. PaymentDetail이 있는 주문 (운세 결제) - PaymentDetail을 통해 확인
    // 2. metadata에 category가 있는 주문
    
    // 먼저 운세 관련 PaymentDetail의 paymentId 목록 조회 (중복 제거)
    const paymentDetails = await this.prisma.paymentDetail.findMany({
      select: {
        paymentId: true,
      },
    });
    const paymentIds = [...new Set(paymentDetails.map((pd) => pd.paymentId))];

    // 운세 관련 주문 필터링
    const where: any = {
      userId,
      OR: [
        // PaymentDetail이 있는 주문 (paymentId로 Payment를 찾고, 그 Payment의 orderId로 Order 필터링)
        ...(paymentIds.length > 0
          ? [
              {
                payment: {
                  id: {
                    in: paymentIds,
                  },
                },
              },
            ]
          : []),
        // metadata에 category가 있는 주문
        {
          metadata: {
            not: null,
          },
        },
      ],
    };

    // 상태 필터
    if (status) {
      where.status = status;
    }

    // 전체 개수 조회
    const total = await this.prisma.order.count({ where });

    // 주문 목록 조회 (결제 정보 포함)
    const orders = await this.prisma.order.findMany({
      where,
      include: {
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // 각 주문에 대해 세션 정보 및 결과 상태 조회
    const items: (PaymentHistoryItem | null)[] = await Promise.all(
      orders.map(async (order) => {
        const metadata = order.metadata as any;
        const sessionId = metadata?.sessionId;

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
            },
          });
        }

        // PaymentDetail 조회 (세션 정보가 없을 경우 또는 documentId 확인용)
        let paymentDetail: any = null;
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
                },
              },
            },
          });

          if (paymentDetail?.session && !session) {
            session = paymentDetail.session;
          }
        }

        // 카테고리 필터링 (세션이 있고 카테고리 필터가 있는 경우)
        if (category && session && session.category !== category) {
          return null; // 필터링에서 제외
        }

        // 모드 필터링 (세션이 있고 모드 필터가 있는 경우)
        if (mode && session && session.mode !== mode) {
          return null; // 필터링에서 제외
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
            formType: (session.formType || 'TRADITIONAL') as FormType,
            mode: session.mode,
          });

          // 문서형인 경우 문서 존재 여부 확인
          if (session.mode === 'DOCUMENT') {
            // 1. PaymentDetail의 documentId 확인 (우선순위)
            if (paymentDetail?.documentId) {
              const document = await this.prisma.documentResult.findUnique({
                where: { id: paymentDetail.documentId },
                select: { id: true },
              });
              if (document) {
                hasDocument = true;
                documentId = document.id;
              }
            }
            
            // 2. PaymentDetail에 documentId가 없으면 세션 정보로 조회
            if (!hasDocument) {
              const document = await this.prisma.documentResult.findFirst({
                where: {
                  userId,
                  category: session.category,
                },
                orderBy: { createdAt: 'desc' },
                select: { id: true },
              });

              if (document) {
                hasDocument = true;
                documentId = document.id;
              } else {
                // 문서가 없고 결제가 완료되었으면 재생성 가능
                canRegenerate =
                  order.status === 'PAID' &&
                  order.payment?.status === 'COMPLETED';
              }
            }
          }
        } else {
          // 세션이 없어도 PaymentDetail의 documentId로 문서 확인
          if (paymentDetail?.documentId) {
            const document = await this.prisma.documentResult.findUnique({
              where: { id: paymentDetail.documentId },
              select: { id: true },
            });
            if (document) {
              hasDocument = true;
              documentId = document.id;
            }
          }
        }

        return {
          id: order.id,
          merchantUid: order.merchantUid,
          orderName: order.orderName,
          amount: order.amount,
          status: order.status,
          payment: order.payment
            ? {
                status: order.payment.status,
                payMethod: order.payment.payMethod,
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
      }),
    );

    // null 제거 (필터링된 항목)
    const filteredItems = items.filter((item) => item !== null) as PaymentHistoryItem[];

    return {
      items: filteredItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

