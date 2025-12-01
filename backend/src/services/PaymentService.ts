import { PrismaClient, PaymentStatus, SubscriptionType, OrderStatus } from '@prisma/client';
import { IdGenerator } from '../utils/idGenerator';
import { PortOneService } from './PortOneService';

const prisma = new PrismaClient();
const portOneService = new PortOneService();

export interface CreatePaymentData {
  userId: string;
  amount: number;
  subscriptionType: SubscriptionType;
  paymentMethod: string;
  description?: string;
  metadata?: any;
  merchantUidPrefix?: string;
  orderName?: string;
  currency?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  merchantUid?: string;
  error?: string;
  subscriptionId?: string;
}

export class PaymentService {
  /**
   * 결제 생성
   */
  async createPayment(data: CreatePaymentData): Promise<PaymentResult> {
    try {
      // 주문 생성 (결제 준비 시점에 하나의 주문만 생성되도록 보장)
      const merchantUid = IdGenerator.generateReference(data.merchantUidPrefix || 'ORDER');
      const order = await prisma.order.create({
        data: {
          userId: data.userId,
          merchantUid,
          amount: data.amount,
          currency: data.currency || 'KRW',
          status: OrderStatus.PENDING,
          description: data.description,
          metadata: data.metadata,
          orderName: data.orderName || data.description || '포포춘 운세 결제',
        },
      });

      // 결제 생성
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          impUid: IdGenerator.generateReference('IMP'),
          pgProvider: 'portone',
          payMethod: data.paymentMethod,
          amount: data.amount,
          currency: data.currency || 'KRW',
          status: PaymentStatus.PENDING,
        },
      });

      return {
        success: true,
        paymentId: payment.id,
        orderId: order.id,
        merchantUid: order.merchantUid,
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
        include: { order: { include: { user: true } } },
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
            userId: payment.order?.user?.id || '',
            status: 'active',
          },
          data: {
            status: 'cancelled',
            updatedAt: new Date(),
          },
        });

        // 새 구독 생성 (기본 30일)
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        const subscription = await tx.subscription.create({
          data: {
            userId: payment.order?.user?.id || '',
            type: 'MONTHLY',
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
          user: true,
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
        where: { order: { userId } },
        include: {
          order: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      const total = await prisma.payment.count({
        where: { order: { userId } },
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

  /**
   * 웹훅 기반 결제 확정 처리 (일회성 결제용)
   * @param orderId - 우리 DB의 Order.id
   * @param paymentId - PortOne에서 보낸 paymentId (impUid에 저장됨)
   * @param amount - 결제 금액
   * @param status - 결제 상태
   */
  async confirmPaymentByWebhook(params: {
    orderId: string;
    paymentId: string; // PortOne의 paymentId
    amount: number;
    status: 'PENDING' | 'PAID' | 'FAILED';
    payMethod?: string; // 결제 방법 (웹훅에서 받은 실제 결제 방법)
    easyPayProvider?: string; // 간편결제 제공자
  }): Promise<{ success: boolean }>{
    try {
      const order = await prisma.order.findUnique({ 
        where: { id: params.orderId },
        include: { payment: true },
      });
      if (!order) return { success: false };

      // Order에 연결된 Payment 찾기
      const payment = order.payment;
      if (!payment) return { success: false };

      // 금액 검증 (다르면 실패 처리 가능)
      if (order.amount !== params.amount) {
        // 금액 불일치시 실패 처리
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: PaymentStatus.FAILED,
            impUid: params.paymentId, // PortOne paymentId 저장
          },
        });
        return { success: false };
      }

      // 트랜잭션으로 Payment와 Order 상태를 함께 업데이트 (원자성 보장)
      await prisma.$transaction(async (tx) => {
        // 결제 방법 결정 (웹훅에서 받은 정보 우선)
        let finalPayMethod = payment.payMethod; // 기존 값 유지
        if (params.payMethod) {
          finalPayMethod = params.payMethod;
        } else if (params.easyPayProvider) {
          // easyPayProvider를 payMethod로 변환
          const providerMap: Record<string, string> = {
            'kakaopay': 'kakao',
            'tosspay': 'toss',
            'naverpay': 'naver',
          };
          finalPayMethod = providerMap[params.easyPayProvider.toLowerCase()] || params.easyPayProvider.toLowerCase();
        }

        // 결제 상태 업데이트 (PortOne paymentId를 impUid에 저장)
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            impUid: params.paymentId, // PortOne의 실제 paymentId 저장
            payMethod: finalPayMethod, // 실제 결제 방법 업데이트
            status: params.status === 'PAID' ? PaymentStatus.COMPLETED : params.status === 'FAILED' ? PaymentStatus.FAILED : PaymentStatus.PENDING,
            paidAt: params.status === 'PAID' ? new Date() : null,
            updatedAt: new Date(),
          },
        });

        // 주문 상태도 동기화
        await tx.order.update({
          where: { id: params.orderId },
          data: {
            status: params.status === 'PAID' ? OrderStatus.PAID : params.status === 'FAILED' ? OrderStatus.CANCELLED : OrderStatus.PENDING,
            updatedAt: new Date(),
          },
        });
      });

      return { success: params.status === 'PAID' };
    } catch (e) {
      console.error('웹훅 결제 확정 처리 오류:', e);
      return { success: false };
    }
  }

  /**
   * Payment 조회 (ID로)
   */
  async getPaymentById(paymentId: string) {
    return await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
  }

  /**
   * PortOne paymentId를 저장 (프론트엔드 콜백에서 호출)
   * @param paymentId - 우리 DB의 Payment.id
   * @param portOnePaymentId - PortOne에서 반환한 paymentId
   */
  async savePortOnePaymentId(paymentId: string, portOnePaymentId: string): Promise<{ success: boolean }> {
    try {
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          impUid: portOnePaymentId,
          updatedAt: new Date(),
        },
      });
      return { success: true };
    } catch (error) {
      console.error('PortOne paymentId 저장 실패:', error);
      return { success: false };
    }
  }

  /**
   * PortOne API를 통해 결제 상태 확인 및 업데이트
   * 세션 생성 시 결제 상태가 PENDING이면 호출 (로컬: 폴링, 실운영: 웹훅)
   * @param paymentId - 우리 DB의 Payment.id
   * @param portOnePaymentId - PortOne에서 반환한 paymentId (옵션, 없으면 impUid에서 조회)
   */
  async verifyAndUpdatePaymentStatus(
    paymentId: string,
    portOnePaymentId?: string,
  ): Promise<{ success: boolean; status?: PaymentStatus }> {
    try {
      // Payment 조회
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });

      if (!payment) {
        console.warn(`[폴링] Payment를 찾을 수 없습니다: ${paymentId}`);
        return { success: false };
      }

      // 이미 COMPLETED 상태면 바로 반환
      if (payment.status === PaymentStatus.COMPLETED) {
        console.log(`[폴링] 이미 결제 완료 상태입니다: ${paymentId}`);
        return { success: true, status: PaymentStatus.COMPLETED };
      }

      // PortOne paymentId 결정: 파라미터 > impUid > 실패
      let actualPortOnePaymentId = portOnePaymentId;
      if (!actualPortOnePaymentId) {
        // impUid가 PortOne paymentId인지 확인 (임시 값이 아닌 경우)
        if (payment.impUid && !payment.impUid.startsWith('IMP')) {
          actualPortOnePaymentId = payment.impUid;
          console.log(`[폴링] impUid에서 PortOne paymentId 조회: ${actualPortOnePaymentId}`);
        } else {
          console.warn(`[폴링] PortOne paymentId가 아직 저장되지 않았습니다. paymentId: ${paymentId}, impUid: ${payment.impUid}`);
          return { success: false };
        }
      } else {
        // 파라미터로 받은 paymentId를 저장
        console.log(`[폴링] PortOne paymentId 저장: ${actualPortOnePaymentId}`);
        await this.savePortOnePaymentId(paymentId, actualPortOnePaymentId);
      }

      // PortOne API로 결제 정보 조회
      console.log(`[폴링] PortOne API 호출: ${actualPortOnePaymentId}`);
      const portOnePayment = await portOneService.getPayment(actualPortOnePaymentId);
      console.log(`[폴링] PortOne 응답 상태: ${portOnePayment.status}`);
      
      // 결제 상태 확인
      if (portOnePayment.status === 'PAID' || portOnePayment.status === 'paid') {
        // 결제 완료 - Payment와 Order 상태를 트랜잭션으로 함께 업데이트
        console.log(`[폴링] 결제 완료 확인, 상태 업데이트 시작: ${paymentId}`);
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.COMPLETED,
              paidAt: portOnePayment.paidAt ? new Date(portOnePayment.paidAt) : new Date(),
              updatedAt: new Date(),
            },
          });

          // Order 상태도 함께 업데이트
          if (payment.order) {
            await tx.order.update({
              where: { id: payment.order.id },
              data: {
                status: OrderStatus.PAID,
                updatedAt: new Date(),
              },
            });
          }
        });

        console.log(`[폴링] 결제 상태 업데이트 완료: ${paymentId} -> COMPLETED`);
        return { success: true, status: PaymentStatus.COMPLETED };
      } else if (portOnePayment.status === 'FAILED' || portOnePayment.status === 'failed' ||
                 portOnePayment.status === 'CANCELLED' || portOnePayment.status === 'cancelled') {
        // 결제 실패/취소 - Payment와 Order 상태를 트랜잭션으로 함께 업데이트
        console.log(`[폴링] 결제 실패/취소 확인, 상태 업데이트: ${paymentId} -> ${portOnePayment.status}`);
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: PaymentStatus.FAILED,
              updatedAt: new Date(),
            },
          });

          // Order 상태도 함께 업데이트
          if (payment.order) {
            await tx.order.update({
              where: { id: payment.order.id },
              data: {
                status: OrderStatus.CANCELLED,
                updatedAt: new Date(),
              },
            });
          }
        });

        return { success: false, status: PaymentStatus.FAILED };
      }

      // 아직 PENDING 상태
      console.log(`[폴링] 아직 결제 대기 중: ${paymentId}, PortOne 상태: ${portOnePayment.status}`);
      return { success: false, status: PaymentStatus.PENDING };
    } catch (error) {
      console.error(`[폴링] PortOne 결제 상태 확인 실패: ${paymentId}`, error);
      // PortOne API 호출 실패 시에도 기존 상태 유지
      return { success: false };
    }
  }

  /**
   * Payment와 Order 상태 동기화 (불일치 수정용)
   * Payment가 COMPLETED인데 Order가 PENDING인 경우 수정
   * @param paymentId - Payment ID
   */
  async syncPaymentAndOrderStatus(paymentId: string): Promise<{ success: boolean; synced: boolean }> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });

      if (!payment || !payment.order) {
        return { success: false, synced: false };
      }

      // Payment가 COMPLETED인데 Order가 PENDING이면 동기화
      if (payment.status === PaymentStatus.COMPLETED && payment.order.status === OrderStatus.PENDING) {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: payment.order.id },
            data: {
              status: OrderStatus.PAID,
              updatedAt: new Date(),
            },
          });
        });
        console.log(`[동기화] Payment ${paymentId}와 Order ${payment.order.id} 상태 동기화 완료`);
        return { success: true, synced: true };
      }

      // Payment가 FAILED인데 Order가 PENDING이면 동기화
      if (payment.status === PaymentStatus.FAILED && payment.order.status === OrderStatus.PENDING) {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: payment.order.id },
            data: {
              status: OrderStatus.CANCELLED,
              updatedAt: new Date(),
            },
          });
        });
        console.log(`[동기화] Payment ${paymentId}와 Order ${payment.order.id} 상태 동기화 완료 (FAILED)`);
        return { success: true, synced: true };
      }

      return { success: true, synced: false }; // 이미 동기화됨
    } catch (error) {
      console.error(`[동기화] Payment와 Order 상태 동기화 실패: ${paymentId}`, error);
      return { success: false, synced: false };
    }
  }
} 