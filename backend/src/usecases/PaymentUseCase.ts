import { OrderStatus, PaymentStatus } from '@prisma/client';
import { RecommendationType } from '../types/common';
import { portOneService, PortOneV2PaymentResponse } from '../services/PortOneService';
import { prisma } from '../config/database';
import { generateMerchantUid } from '../utils/idGenerator';
import { GenerateRecommendationUseCase } from './GenerateRecommendationUseCase';

export interface CreateOrderData {
  userId: string;
  amount: number;
  currency?: string;
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
   * 결제 검증 및 처리
   */
  async verifyPayment(data: VerifyPaymentData): Promise<{ success: boolean; payment?: any; recommendation?: any; error?: string }> {
    try {
      // 1. PortOne V2 API로 결제 정보 조회
      const paymentData = await portOneService.getPayment(data.impUid);

      // 2. customData에서 주문 ID 추출
      if (!paymentData.customData) {
        return {
          success: false,
          error: '결제 정보에 주문 ID가 없습니다.',
        };
      }

      const customData = JSON.parse(paymentData.customData);
      const orderId = customData.orderId;

      if (!orderId) {
        return {
          success: false,
          error: '결제 정보에 주문 ID가 없습니다.',
        };
      }

      // 3. 주문 조회
      const order = await prisma?.order?.findUnique({
        where: { id: orderId },
        include: {
          payment: true,
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
          error: '주문을 찾을 수 없습니다.',
        };
      }

      // 4. 이미 처리된 주문인지 확인 - 성공 응답 반환
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

      // 5. V2 결제 검증
      const isValidPayment = portOneService.verifyPayment(paymentData, order.amount, order.currency);
      if (!isValidPayment) {
        return {
          success: false,
          error: '결제 정보가 주문과 일치하지 않습니다.',
        };
      }

      // 5. 트랜잭션으로 주문 및 결제 정보 업데이트
      const result = await prisma?.$transaction(async (tx) => {
        // 주문 상태 업데이트
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
          },
        });

        // 결제 정보 저장
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            impUid: data.impUid,
            pgProvider: paymentData.channel?.type || 'portone',
            payMethod: 'card',
            amount: paymentData.amount?.total || 0,
            currency: paymentData.amount?.currency || 'KRW',
            status: PaymentStatus.COMPLETED,
            paidAt: paymentData.paidAt ? new Date(paymentData.paidAt) : new Date(),
            rawResponse: paymentData as any,
          },
        });

        return { order: updatedOrder, payment };
      });

      if (!result) {
        return {
          success: false,
          error: '결제 처리에 실패했습니다.',
        };
      }

      console.log('✅ 결제 검증 및 처리 완료:', {
        orderId: result.order.id,
        impUid: data.impUid,
        amount: result.payment.amount,
      });

      // 6. 결제 완료 후 추천 번호 생성 (프리미엄 추천)
      let recommendation = null;
      if (this.generateRecommendationUseCase) {
        try {
          const recommendationResult = await this.generateRecommendationUseCase.execute({
            userId: order.userId,
            type: 'PREMIUM' as RecommendationType,
            // userInput: '결제 완료 후 프리미엄 추천',
            // metadata: {
            //   orderId: result.order.id,
            //   paymentId: result.payment.id,
            //   amount: result.payment.amount,
            // },
          });

          if (recommendationResult) {
            recommendation = recommendationResult;
            console.log('✅ 결제 완료 후 추천 번호 생성 완료:', {
              orderId: result.order.id,
              recommendationId: 'generated',
            });
          }
        } catch (error) {
          console.error('❌ 결제 완료 후 추천 번호 생성 실패:', error);
          // 추천 번호 생성 실패는 결제 성공에 영향을 주지 않음
        }
      }

      return {
        success: true,
        payment: result.payment,
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
   * 결제 상태 변경
   */
  async updatePaymentStatus(data: UpdatePaymentStatusData): Promise<{ success: boolean; order?: any; payment?: any; error?: string }> {
    try {
      // 1. 주문 조회 및 권한 확인
      const order = await prisma?.order?.findUnique({
        where: { id: data.orderId },
        include: {
          payment: true,
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
          error: '주문을 찾을 수 없습니다.',
        };
      }

      // 2. 사용자 권한 확인
      if (order.userId !== data.userId) {
        return {
          success: false,
          error: '주문을 수정할 권한이 없습니다.',
        };
      }

      // 3. 상태 변경 가능 여부 확인
      if (order.status === OrderStatus.PAID && data.status === OrderStatus.USER_CANCELLED) {
        return {
          success: false,
          error: '이미 결제 완료된 주문은 사용자 취소할 수 없습니다.',
        };
      }

      // 4. 트랜잭션으로 상태 변경
      const result = await prisma?.$transaction(async (tx) => {
        // 주문 상태 업데이트
        const updatedOrder = await tx.order.update({
          where: { id: data.orderId },
          data: {
            status: data.status,
            updatedAt: new Date(),
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

        // 결제 정보가 있으면 결제 상태도 업데이트
        let updatedPayment = null;
        if (order.payment) {
          updatedPayment = await tx.payment.update({
            where: { orderId: data.orderId },
            data: {
              status: this.mapOrderStatusToPaymentStatus(data.status),
              updatedAt: new Date(),
            },
          });
        }

        return {
          order: updatedOrder,
          payment: updatedPayment,
        };
      });

      console.log('✅ 결제 상태 변경 완료:', {
        orderId: data.orderId,
        oldStatus: order.status,
        newStatus: data.status,
        reason: data.reason,
      });

      return {
        success: true,
        order: result.order,
        payment: result.payment,
      };
    } catch (error) {
      console.error('결제 상태 변경 오류:', error);
      return {
        success: false,
        error: '결제 상태 변경에 실패했습니다.',
      };
    }
  }

  /**
   * OrderStatus를 PaymentStatus로 매핑
   */
  private mapOrderStatusToPaymentStatus(orderStatus: OrderStatus): PaymentStatus {
    switch (orderStatus) {
      case OrderStatus.PENDING:
        return PaymentStatus.PENDING;
      case OrderStatus.PAID:
        return PaymentStatus.COMPLETED;
      case OrderStatus.FAILED:
        return PaymentStatus.FAILED;
      case OrderStatus.CANCELLED:
        return PaymentStatus.CANCELLED;
      case OrderStatus.USER_CANCELLED:
        return PaymentStatus.USER_CANCELLED;
      case OrderStatus.REFUNDED:
        return PaymentStatus.REFUNDED;
      default:
        return PaymentStatus.PENDING;
    }
  }

  /**
   * 결제 검증 로직
   */
  private validatePayment(order: any, paymentData: any): { isValid: boolean; error?: string } {
    // 1. 결제 상태 확인
    if (paymentData.status !== 'paid') {
      return {
        isValid: false,
        error: `결제가 완료되지 않았습니다. (상태: ${paymentData.status})`,
      };
    }

    // 2. 주문번호 일치 확인
    if (paymentData.merchant_uid !== order.merchantUid) {
      return {
        isValid: false,
        error: '주문번호가 일치하지 않습니다.',
      };
    }

    // 3. 결제 금액 확인
    if (paymentData.amount !== order.amount) {
      return {
        isValid: false,
        error: `결제 금액이 일치하지 않습니다. (주문: ${order.amount}, 결제: ${paymentData.amount})`,
      };
    }

    // 4. 통화 확인
    if (paymentData.currency !== order.currency) {
      return {
        isValid: false,
        error: '결제 통화가 일치하지 않습니다.',
      };
    }

    return { isValid: true };
  }

  /**
   * 주문 조회
   */
  async getOrder(orderId: string, userId?: string): Promise<{ success: boolean; order?: any; error?: string }> {
    try {
      const order = await prisma?.order?.findUnique({
        where: { id: orderId },
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

      // 사용자 권한 확인
      if (userId && order.userId !== userId) {
        return {
          success: false,
          error: '주문에 대한 접근 권한이 없습니다.',
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
} 