import { OrderStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '../config/database';
import { generateMerchantUid } from '../utils/idGenerator';
import { GenerateRecommendationUseCase } from './GenerateRecommendationUseCase';

export interface CreateOrderData {
  userId: string;
  amount: number;
  currency?: string;
  orderName: string;
  description?: string;
  metadata?: any;
}

export interface VerifyPaymentData {
  impUid: string;
  merchantUid: string;
}

export interface UpdatePaymentStatusData {
  userId: string;
  orderId: string;
  status: OrderStatus;
  reason?: string;
}

export class PaymentUseCase {
  constructor(private generateRecommendationUseCase?: GenerateRecommendationUseCase) {}

  /**
   * 주문 생성
   */
  async createOrder(data: CreateOrderData): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      // 중복되지 않는 merchant_uid 생성
      const merchantUid = generateMerchantUid();

      const order = await prisma?.order?.create({
        data: {
          userId: data.userId,
          merchantUid,
          amount: data.amount,
          currency: data.currency || 'KRW',
          orderName: data.orderName,
          description: data.description,
          metadata: data.metadata,
          status: OrderStatus.PENDING,
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      });

      if (!order) {
        return {
          success: false,
          error: '주문 생성에 실패했습니다.',
        };
      }

      return {
        success: true,
        order,
      };
    } catch (error) {
      console.error('주문 생성 오류:', error);
      return {
        success: false,
        error: '주문 생성에 실패했습니다.',
      };
    }
  }

  /**
   * 결제 검증 및 처리 (기본 버전)
   */
  async verifyPayment(data: VerifyPaymentData): Promise<{ success: boolean; payment?: any; recommendation?: any; error?: string }> {
    try {
      // 주문 조회
      const order = await prisma?.order?.findFirst({
        where: {
          OR: [
            { merchantUid: data.merchantUid },
            { id: data.merchantUid } // merchantUid가 아닌 경우 orderId로 조회
          ]
        },
        include: {
          user: true,
          payment: true,
        },
      });

      if (!order) {
        return {
          success: false,
          error: '주문을 찾을 수 없습니다.',
        };
      }

      // 이미 처리된 주문인지 확인
      if (order.status === OrderStatus.PAID) {
        console.log('✅ 이미 처리된 주문 - 성공 응답 반환:', {
          orderId: order.id,
          status: order.status,
        });
        return {
          success: true,
          payment: order.payment,
          recommendation: null, // 이미 처리된 주문이므로 추천 생성하지 않음
        };
      }

      // 주문 상태를 PAID로 업데이트
      const updatedOrder = await prisma?.order?.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID },
        include: {
          user: true,
          payment: true,
        },
      });

      // 결제 정보 생성
      const payment = await prisma?.payment?.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          amount: order.amount,
          currency: order.currency,
          paymentMethod: 'PORTONE',
          status: PaymentStatus.COMPLETED,
          subscriptionType: 'MONTHLY',
          subscriptionDuration: 30,
          externalPaymentId: data.impUid,
          description: order.orderName,
        },
      });

      // 추천 생성 (선택사항)
      let recommendation = null;
      if (this.generateRecommendationUseCase) {
        try {
          const recommendationResult = await this.generateRecommendationUseCase.execute({
            userId: order.userId,
            type: 'PREMIUM' as any,
            conditions: {},
          });
          
          if (recommendationResult && (recommendationResult as any).success) {
            recommendation = (recommendationResult as any).data;
          }
        } catch (error) {
          console.error('추천 생성 오류:', error);
        }
      }

      return {
        success: true,
        payment,
        recommendation,
      };
    } catch (error) {
      console.error('결제 검증 오류:', error);
      return {
        success: false,
        error: '결제 검증에 실패했습니다.',
      };
    }
  }

  /**
   * 결제 상태 업데이트
   */
  async updatePaymentStatus(data: UpdatePaymentStatusData): Promise<{ success: boolean; order?: any; payment?: any; error?: string }> {
    try {
      // 주문 조회
      const order = await prisma?.order?.findFirst({
        where: {
          id: data.orderId,
          userId: data.userId,
        },
        include: {
          payment: true,
        },
      });

      if (!order) {
        return {
          success: false,
          error: '주문을 찾을 수 없습니다.',
        };
      }

      // 주문 상태 업데이트
      const updatedOrder = await prisma?.order?.update({
        where: { id: order.id },
        data: { status: data.status },
        include: {
          payment: true,
        },
      });

      // 결제 정보도 업데이트
      let updatedPayment = null;
      if (order.payment) {
        updatedPayment = await prisma?.payment?.update({
          where: { id: order.payment.id },
          data: { status: this.mapOrderStatusToPaymentStatus(data.status) },
        });
      }

      return {
        success: true,
        order: updatedOrder,
        payment: updatedPayment,
      };
    } catch (error) {
      console.error('결제 상태 업데이트 오류:', error);
      return {
        success: false,
        error: '결제 상태 업데이트에 실패했습니다.',
      };
    }
  }

  /**
   * 주문 조회
   */
  async getOrder(orderId: string, userId?: string): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      const where: any = { id: orderId };
      if (userId) {
        where.userId = userId;
      }

      const order = await prisma?.order?.findFirst({
        where,
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
            },
          },
          payment: true,
        },
      });

      if (!order) {
        return {
          success: false,
          error: '주문을 찾을 수 없습니다.',
        };
      }

      return {
        success: true,
        order,
      };
    } catch (error) {
      console.error('주문 조회 오류:', error);
      return {
        success: false,
        error: '주문 조회에 실패했습니다.',
      };
    }
  }

  /**
   * 사용자 주문 목록 조회
   */
  async getUserOrders(userId: string, page: number = 1, limit: number = 20): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const skip = (page - 1) * limit;

      const [orders, total] = await Promise.all([
        prisma?.order?.findMany({
          where: { userId },
          include: {
            payment: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma?.order?.count({
          where: { userId },
        }),
      ]);

      return {
        success: true,
        data: {
          orders,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      };
    } catch (error) {
      console.error('사용자 주문 목록 조회 오류:', error);
      return {
        success: false,
        error: '주문 목록 조회에 실패했습니다.',
      };
    }
  }

  /**
   * OrderStatus를 PaymentStatus로 매핑
   */
  private mapOrderStatusToPaymentStatus(orderStatus: OrderStatus): PaymentStatus {
    switch (orderStatus) {
      case OrderStatus.PAID:
        return PaymentStatus.COMPLETED;
      case OrderStatus.FAILED:
        return PaymentStatus.FAILED;
      case OrderStatus.CANCELLED:
      case OrderStatus.USER_CANCELLED:
        return PaymentStatus.CANCELLED;
      case OrderStatus.REFUNDED:
        return PaymentStatus.REFUNDED;
      default:
        return PaymentStatus.PENDING;
    }
  }
} 