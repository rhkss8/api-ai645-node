/**
 * 운세 결제 준비 UseCase
 * 결제 전 주문 생성 및 결제 정보 반환
 */
import { PrismaClient, SubscriptionType } from '@prisma/client';
import {
  FortuneProductType,
  FortuneCategory,
  shouldCheckExistingDocument,
  ChatEntitlementDays,
} from '../types/fortune';
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
  hasExistingDocument?: boolean; // 기존 문서 존재 여부 (문서형 리포트만)
  existingDocumentId?: string | null; // 기존 문서 ID (있는 경우)
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
    payMethod?: string, // 결제 방법 (card, kakao, toss 등)
    easyPayProvider?: string, // 간편결제 제공자 (카카오페이, 토스페이 등)
    chatEntitlementDays?: ChatEntitlementDays,
  ): Promise<PreparePaymentResult> {
    let product;
    if (productType === FortuneProductType.CHAT_SESSION) {
      if (chatEntitlementDays == null || ![1, 7, 30].includes(Number(chatEntitlementDays))) {
        throw new Error('채팅형은 chatEntitlementDays(1, 7, 30)가 필요합니다.');
      }
      product = this.productService.getChatEntitlementProduct(chatEntitlementDays);
    } else {
      product = this.productService.getProduct(productType, category);
    }

    // 결제 방법 결정 (우선순위: payMethod > easyPayProvider > 기본값 'card')
    let paymentMethod = 'card'; // 기본값
    if (payMethod) {
      paymentMethod = payMethod;
      console.log(`[결제 준비] payMethod 사용: ${paymentMethod}`);
    } else if (easyPayProvider) {
      // easyPayProvider를 payMethod로 변환
      const providerMap: Record<string, string> = {
        'kakaopay': 'kakao',
        'tosspay': 'toss',
        'naverpay': 'naver',
      };
      paymentMethod = providerMap[easyPayProvider.toLowerCase()] || easyPayProvider.toLowerCase();
      console.log(`[결제 준비] easyPayProvider 변환: ${easyPayProvider} -> ${paymentMethod}`);
    } else {
      console.log(`[결제 준비] 결제 방법 없음, 기본값 사용: ${paymentMethod}`);
    }

    // easyPayProvider 결정 (원본 값 유지)
    let finalEasyPayProvider: string | undefined = undefined;
    if (easyPayProvider) {
      finalEasyPayProvider = easyPayProvider;
    } else if (payMethod && ['kakao', 'toss', 'naver'].includes(payMethod.toLowerCase())) {
      // payMethod가 간편결제인 경우 easyPayProvider 역변환
      const reverseMap: Record<string, string> = {
        'kakao': 'kakaopay',
        'toss': 'tosspay',
        'naver': 'naverpay',
      };
      finalEasyPayProvider = reverseMap[payMethod.toLowerCase()];
    }

    // 결제 및 주문 생성 (결제 서비스에서 일괄 처리)
    const paymentResult = await this.paymentService.createPayment({
      userId,
      amount: product.finalAmount, // 할인 적용된 실제 결제 금액
      subscriptionType: SubscriptionType.LIFETIME,
      paymentMethod, // 동적으로 결정된 결제 방법
      easyPayProvider: finalEasyPayProvider, // 간편결제 제공자 저장
      description: product.description,
      metadata: {
        productId: product.productId,
        productType,
        category,
        duration: product.duration,
        chatEntitlementDays: product.entitlementDays,
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

    // 0원 결제는 자동으로 완료 처리 (PortOne 결제 없이도 세션 생성 가능)
    if (product.finalAmount === 0) {
      console.log(`[결제 준비] 0원 결제 자동 완료 처리: paymentId=${paymentResult.paymentId}`);
      const freePaymentResult = await this.paymentService.completeFreePayment(paymentResult.paymentId);
      if (!freePaymentResult.success) {
        console.error('[결제 준비] 0원 결제 자동 완료 실패:', freePaymentResult.error);
        // 실패해도 계속 진행 (나중에 웹훅으로 처리될 수 있음)
      } else {
        console.log(`[결제 준비] 0원 결제 자동 완료 성공: paymentId=${paymentResult.paymentId}`);
      }
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

    // 기존 문서 체크 (문서형 리포트이고, 해당 카테고리가 체크 대상인 경우)
    let hasExistingDocument = false;
    let existingDocumentId: string | null = null;
    
    if (productType === FortuneProductType.DOCUMENT_REPORT && shouldCheckExistingDocument(category)) {
      try {
        // 유효한 기존 문서 조회 (만료되지 않은 문서)
        const existingDocument = await this.prisma.documentResult.findFirst({
          where: {
            userId,
            category,
            expiresAt: {
              gt: new Date(), // 만료되지 않은 문서만
            },
          },
          orderBy: {
            createdAt: 'desc', // 가장 최근 문서
          },
          select: {
            id: true,
          },
        });

        if (existingDocument) {
          hasExistingDocument = true;
          existingDocumentId = existingDocument.id;
          console.log(`[결제 준비] 기존 문서 발견: category=${category}, documentId=${existingDocument.id}`);
        } else {
          console.log(`[결제 준비] 기존 문서 없음: category=${category}`);
        }
      } catch (error) {
        console.error('[결제 준비] 기존 문서 조회 실패:', error);
        // 기존 문서 조회 실패해도 결제 준비는 계속 진행
      }
    }

    return {
      orderId: paymentResult.orderId,
      paymentId: paymentResult.paymentId,
      amount: product.finalAmount, // 실제 결제 금액 반환
      productName: product.name,
      merchantUid: paymentResult.merchantUid,
      buyerEmail, // 구매자 이메일
      buyerPhone, // 구매자 연락처
      hasExistingDocument, // 기존 문서 존재 여부
      existingDocumentId, // 기존 문서 ID
    };
  }
}
