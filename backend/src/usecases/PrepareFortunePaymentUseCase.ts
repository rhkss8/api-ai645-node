/**
 * 운세 결제 준비 UseCase
 * 결제 전 주문 생성 및 결제 정보 반환
 */
import { PrismaClient, SubscriptionType } from '@prisma/client';
import { FortuneProductType, FortuneCategory } from '../types/fortune';
import { FortuneProductService } from '../services/FortuneProductService';
import { PaymentService } from '../services/PaymentService';

export interface PreparePaymentResult {
  orderId: string;
  paymentId: string;
  amount: number;
  productName: string;
  merchantUid: string;
  buyerEmail?: string | null; // 구매자 이메일
  buyerPhone?: string | null; // 구매자 연락처
}

export class PrepareFortunePaymentUseCase {
  constructor(
    private readonly productService: FortuneProductService,
    private readonly paymentService: PaymentService,
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    userId: string,
    productType: FortuneProductType,
    category: FortuneCategory,
    durationMinutes?: number,
    payMethod?: string, // 결제 방법 (card, kakao, toss 등)
    easyPayProvider?: string, // 간편결제 제공자 (카카오페이, 토스페이 등)
  ): Promise<PreparePaymentResult> {
    // 상품 정보 조회 (할인 적용된 가격 포함)
    const product = this.productService.getProduct(productType, category, durationMinutes);

    // 결제 방법 결정 (우선순위: payMethod > easyPayProvider > 기본값 'card')
    let paymentMethod = 'card'; // 기본값
    if (payMethod) {
      paymentMethod = payMethod;
    } else if (easyPayProvider) {
      // easyPayProvider를 payMethod로 변환
      const providerMap: Record<string, string> = {
        'kakaopay': 'kakao',
        'tosspay': 'toss',
        'naverpay': 'naver',
      };
      paymentMethod = providerMap[easyPayProvider.toLowerCase()] || easyPayProvider.toLowerCase();
    }

    // 결제 및 주문 생성 (결제 서비스에서 일괄 처리)
    const paymentResult = await this.paymentService.createPayment({
      userId,
      amount: product.finalAmount, // 할인 적용된 실제 결제 금액
      subscriptionType: SubscriptionType.LIFETIME,
      paymentMethod, // 동적으로 결정된 결제 방법
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

    // 사용자 정보 조회 (이메일, 연락처)
    let buyerEmail: string | null = null;
    let buyerPhone: string | null = null;
    
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      }) as { email: string | null; phone?: string | null } | null;
      
      buyerEmail = user?.email || null;
      buyerPhone = user?.phone || null;
    } catch (error) {
      console.error('[결제 준비] 사용자 정보 조회 실패:', error);
      // 사용자 정보 조회 실패해도 결제 준비는 계속 진행 (이메일/연락처는 null)
    }

    return {
      orderId: paymentResult.orderId,
      paymentId: paymentResult.paymentId,
      amount: product.finalAmount, // 실제 결제 금액 반환
      productName: product.name,
      merchantUid: paymentResult.merchantUid,
      buyerEmail, // 구매자 이메일
      buyerPhone, // 구매자 연락처
    };
  }
}
