/**
 * 운세 결제 준비 UseCase
 * 결제 전 주문 생성 및 결제 정보 반환
 */
import { SubscriptionType } from '@prisma/client';
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

    // 결제 및 주문 생성 (결제 서비스에서 일괄 처리)
    const paymentResult = await this.paymentService.createPayment({
      userId,
      amount: product.finalAmount, // 할인 적용된 실제 결제 금액
      subscriptionType: SubscriptionType.LIFETIME,
      paymentMethod: 'card',
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
      merchantUidPrefix: 'FORTUNE',
      orderName: product.name,
    });

    if (!paymentResult.success || !paymentResult.paymentId || !paymentResult.orderId || !paymentResult.merchantUid) {
      throw new Error('결제 준비에 실패했습니다.');
    }

    return {
      orderId: paymentResult.orderId,
      paymentId: paymentResult.paymentId,
      amount: product.finalAmount, // 실제 결제 금액 반환
      productName: product.name,
      merchantUid: paymentResult.merchantUid,
    };
  }
}
