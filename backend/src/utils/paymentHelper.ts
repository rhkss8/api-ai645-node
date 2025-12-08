/**
 * 결제 관련 헬퍼 함수
 * 실제 결제 완료 후 PaymentDetail 생성에 사용
 */
import { CreatePaymentDetailUseCase } from '../usecases/CreatePaymentDetailUseCase';
import { PrismaClient } from '@prisma/client';
import { SessionMode, FortuneCategory } from '../types/fortune';

/**
 * 결제 완료 후 PaymentDetail 생성
 * 
 * 실제 결제 시스템(PortOne 등)과 연동 시 사용
 * 예: PaymentController에서 결제 완료 후 호출
 */
export async function createPaymentDetailForFortune(
  prisma: PrismaClient,
  data: {
    paymentId: string;
    sessionId?: string;
    documentId?: string;
    sessionType: SessionMode;
    category: FortuneCategory;
    result?: any;
    expiredAt?: Date;
  },
): Promise<void> {
  const createPaymentDetailUseCase = new CreatePaymentDetailUseCase(prisma);
  await createPaymentDetailUseCase.execute(data);
}

/**
 * 홍시 구매 시 예상 만료 시간 계산
 */
export function calculateHongsiExpiration(minutes: number): Date {
  const now = new Date();
  return new Date(now.getTime() + minutes * 60 * 1000);
}

/**
 * 홍시 단위별 금액 (향후 실제 금액 적용)
 */
export const hongsiPricing: Record<string, number> = {
  MINUTES_5: 1000,    // 5분: 1,000원
  MINUTES_10: 1800,   // 10분: 1,800원
  MINUTES_30: 5000,   // 30분: 5,000원
};
