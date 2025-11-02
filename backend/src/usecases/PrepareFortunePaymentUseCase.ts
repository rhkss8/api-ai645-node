/**
 * 운세 결제 준비 UseCase
 * 결제 전 주문 생성 및 결제 정보 반환
 */
import { PrismaClient } from '@prisma/client';
import { FortuneProductType, FortuneCategory } from '../types/fortune';
import { FortuneProductService } from '../services/FortuneProductService';
import { PaymentService } from '../services/PaymentService';

export interface PreparePaymentResult {
  orderId: string;
  paymentId: string;
  amount: number;
  productName: string;
  merchantUid: string;
}

export class PrepareFortunePaymentUseCase {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly productService: FortuneProductService,
    private readonly paymentService: PaymentService,
  ) {}

  async execute(
    userId: string,
    productType: FortuneProductType,
    category: FortuneCategory,
    durationMinutes?: number,
  ): Promise<PreparePaymentResult> {
    // 상품 정보 조회 (할인 적용된 가격 포함)
    const product = this.productService.getProduct(productType, category, durationMinutes);

    // 주문 생성 (실제 결제 금액 사용)
    const order = await this.prisma.order.create({
      data: {
        userId,
        merchantUid: `fortune_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: product.finalAmount, // 할인 적용된 실제 결제 금액
        currency: 'KRW',
        orderName: product.name,
        description: product.description,
        metadata: {
          productId: product.productId,
          productType,
          category,
          duration: product.duration,
          originalAmount: product.amount,
          discountRate: product.discountRate,
          finalAmount: product.finalAmount,
        },
      },
    });

    // 결제 생성 (실제 결제 금액 사용)
    const paymentResult = await this.paymentService.createPayment({
      userId,
      amount: product.finalAmount, // 할인 적용된 실제 결제 금액
      currency: 'KRW',
      paymentMethod: 'card',
      description: product.description,
      subscriptionType: undefined, // 운세는 구독 없음
      metadata: {
        orderId: order.id,
        productId: product.productId,
        productType,
        category,
        duration: product.duration,
        originalAmount: product.amount,
        discountRate: product.discountRate,
      },
    });

    if (!paymentResult.success || !paymentResult.paymentId) {
      throw new Error('결제 준비에 실패했습니다.');
    }

    return {
      orderId: order.id,
      paymentId: paymentResult.paymentId,
      amount: product.finalAmount, // 실제 결제 금액 반환
      productName: product.name,
      merchantUid: order.merchantUid,
    };
  }
}
