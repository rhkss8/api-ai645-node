/**
 * 운세 결제 취소 UseCase
 */
import { PrismaClient, PaymentStatus, OrderStatus } from '@prisma/client';

export interface CancelPaymentParams {
  paymentId: string;
  userId: string;
  reason?: string; // 취소 사유
}

export interface CancelPaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  error?: string;
  message?: string;
}

export class CancelFortunePaymentUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(params: CancelPaymentParams): Promise<CancelPaymentResult> {
    const { paymentId, userId, reason } = params;

    try {
      // Payment 조회 (Order 포함)
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: true,
        },
      });

      if (!payment) {
        return {
          success: false,
          error: 'PAYMENT_NOT_FOUND',
          message: '결제 정보를 찾을 수 없습니다.',
        };
      }

      // 사용자 확인
      if (payment.order.userId !== userId) {
        return {
          success: false,
          error: 'PAYMENT_ACCESS_DENIED',
          message: '본인의 결제만 취소할 수 있습니다.',
        };
      }

      // 이미 취소된 결제인지 확인
      if (
        payment.status === PaymentStatus.CANCELLED ||
        payment.status === PaymentStatus.USER_CANCELLED
      ) {
        return {
          success: false,
          error: 'ALREADY_CANCELLED',
          message: '이미 취소된 결제입니다.',
        };
      }

      // FAILED 상태는 이미 실패한 결제이므로 취소 불필요
      if (payment.status === PaymentStatus.FAILED) {
        return {
          success: false,
          error: 'CANNOT_CANCEL',
          message: `취소할 수 없는 결제 상태입니다. (현재 상태: ${payment.status})`,
        };
      }

      // 상태별 취소 정책
      // - PENDING  : 결제 완료 전 사용자가 취소 → USER_CANCELLED 로 마킹 (PG 환불 불필요)
      // - COMPLETED: 실제 환불(PortOne 취소) 연동 전까지는 DB 상태만 CANCELLED 로 변경 (추후 확장 고려)
      const isPending = payment.status === PaymentStatus.PENDING;

      // 트랜잭션으로 결제 취소 처리 (DB 기준)
      const result = await this.prisma.$transaction(async (tx) => {
        // 0. PaymentDetail 조회 (세션 연결용)
        const paymentDetails = await tx.paymentDetail.findMany({
          where: { paymentId },
        });

        // 1. Payment 상태를 변경
        const nextPaymentStatus = isPending
          ? PaymentStatus.USER_CANCELLED
          : PaymentStatus.CANCELLED;

        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: nextPaymentStatus,
            updatedAt: new Date(),
          },
        });

        // 2. Order 상태를 변경
        const nextOrderStatus = isPending
          ? OrderStatus.USER_CANCELLED
          : OrderStatus.CANCELLED;

        const updatedOrder = await tx.order.update({
          where: { id: payment.order.id },
          data: {
            status: nextOrderStatus,
            updatedAt: new Date(),
          },
        });

        // 3. 관련 세션 비활성화 (PaymentDetail을 통해 세션 찾기)
        if (paymentDetails && paymentDetails.length > 0) {
          for (const detail of paymentDetails) {
            if (detail.sessionId) {
              // 세션 비활성화
              await tx.fortuneSession.updateMany({
                where: { id: detail.sessionId },
                data: {
                  isActive: false,
                  updatedAt: new Date(),
                },
              });
            }
          }
        }

        return { payment: updatedPayment, order: updatedOrder };
      });

      console.log(`[결제 취소] 성공: paymentId=${paymentId}, orderId=${result.order.id}, reason=${reason || '없음'}`);

      return {
        success: true,
        paymentId: result.payment.id,
        orderId: result.order.id,
        message: '결제가 성공적으로 취소되었습니다.',
      };
    } catch (error: any) {
      console.error(`[결제 취소] 실패: paymentId=${paymentId}`, error);
      return {
        success: false,
        error: 'CANCEL_FAILED',
        message: error.message || '결제 취소에 실패했습니다.',
      };
    }
  }
}

