import { PrismaClient, PaymentStatus, SubscriptionType } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreatePaymentData {
  userId: string;
  amount: number;
  subscriptionType: SubscriptionType;
  paymentMethod: string;
  description?: string;
  metadata?: any;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  subscriptionId?: string;
}

export class PaymentService {
  /**
   * 결제 생성
   */
  async createPayment(data: CreatePaymentData): Promise<PaymentResult> {
    try {
      // 구독 기간 계산
      const subscriptionDuration = this.getSubscriptionDuration(data.subscriptionType);
      
      // 결제 생성
      const payment = await prisma.payment.create({
        data: {
          userId: data.userId,
          amount: data.amount,
          subscriptionType: data.subscriptionType,
          subscriptionDuration,
          paymentMethod: data.paymentMethod,
          description: data.description,
          metadata: data.metadata,
          status: PaymentStatus.PENDING,
        },
      });

      return {
        success: true,
        paymentId: payment.id,
      };
    } catch (error) {
      console.error('결제 생성 오류:', error);
      return {
        success: false,
        error: '결제 생성에 실패했습니다.',
      };
    }
  }

  /**
   * 결제 완료 처리
   */
  async completePayment(paymentId: string, externalPaymentId?: string): Promise<PaymentResult> {
    try {
      // 결제 정보 조회
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { user: true },
      });

      if (!payment) {
        return {
          success: false,
          error: '결제 정보를 찾을 수 없습니다.',
        };
      }

      if (payment.status !== PaymentStatus.PENDING) {
        return {
          success: false,
          error: '이미 처리된 결제입니다.',
        };
      }

      // 트랜잭션으로 결제 완료 및 구독 생성
      const result = await prisma.$transaction(async (tx: any) => {
        // 결제 상태 업데이트
        const updatedPayment = await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: PaymentStatus.COMPLETED,
            externalPaymentId,
            updatedAt: new Date(),
          },
        });

        // 기존 활성 구독 비활성화
        await tx.subscription.updateMany({
          where: {
            userId: payment.userId,
            status: 'active',
          },
          data: {
            status: 'cancelled',
            updatedAt: new Date(),
          },
        });

        // 새 구독 생성
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + payment.subscriptionDuration);

        const subscription = await tx.subscription.create({
          data: {
            userId: payment.userId,
            paymentId: payment.id,
            type: payment.subscriptionType,
            endDate,
            status: 'active',
            autoRenew: false, // 기본값
          },
        });

        return { payment: updatedPayment, subscription };
      });

      return {
        success: true,
        paymentId: result.payment.id,
        subscriptionId: result.subscription.id,
      };
    } catch (error) {
      console.error('결제 완료 처리 오류:', error);
      return {
        success: false,
        error: '결제 완료 처리에 실패했습니다.',
      };
    }
  }

  /**
   * 사용자의 활성 구독 확인
   */
  async checkActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'active',
          endDate: {
            gt: new Date(),
          },
        },
      });

      return !!subscription;
    } catch (error) {
      console.error('구독 확인 오류:', error);
      return false;
    }
  }

  /**
   * 사용자의 구독 정보 조회
   */
  async getUserSubscription(userId: string) {
    try {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId,
          status: 'active',
        },
        include: {
          payment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return subscription;
    } catch (error) {
      console.error('구독 정보 조회 오류:', error);
      return null;
    }
  }

  /**
   * 사용자의 결제 내역 조회
   */
  async getUserPayments(userId: string, limit = 10, offset = 0) {
    try {
      const payments = await prisma.payment.findMany({
        where: { userId },
        include: {
          subscription: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      const total = await prisma.payment.count({
        where: { userId },
      });

      return {
        payments,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('결제 내역 조회 오류:', error);
      return {
        payments: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * 구독 기간 계산
   */
  private getSubscriptionDuration(type: SubscriptionType): number {
    switch (type) {
      case SubscriptionType.MONTHLY:
        return 30;
      case SubscriptionType.YEARLY:
        return 365;
      case SubscriptionType.LIFETIME:
        return 36500; // 100년 (실질적으로 평생)
      default:
        return 30;
    }
  }

  /**
   * 만료된 구독 정리 (스케줄러용)
   */
  async cleanupExpiredSubscriptions(): Promise<number> {
    try {
      const result = await prisma.subscription.updateMany({
        where: {
          status: 'active',
          endDate: {
            lt: new Date(),
          },
        },
        data: {
          status: 'expired',
          updatedAt: new Date(),
        },
      });

      return result.count;
    } catch (error) {
      console.error('만료된 구독 정리 오류:', error);
      return 0;
    }
  }
} 