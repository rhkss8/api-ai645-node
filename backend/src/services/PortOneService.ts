import { PaymentClient } from '@portone/server-sdk';
import { prisma } from '../config/database';

export interface PortOneV2PaymentResponse {
  paymentId: string;
  orderName: string;
  amount: {
    total: number;
    currency: string;
  };
  status: string;
  customData?: string;
  channel: {
    type: string;
    payMethod?: string; // 결제 방법 (card, kakao, toss 등)
    easyPay?: {
      provider?: string; // 간편결제 제공자 (kakaopay, tosspay 등)
    };
  };
  paidAt?: string;
  failedAt?: string;
  cancelledAt?: string;
}

export class PortOneService {
  private client: any;

  constructor() {
    this.client = PaymentClient({ secret: process.env.V2_API_SECRET ?? '' });
  }

  /**
   * V2 결제 정보 조회
   */
  async getPayment(paymentId: string): Promise<PortOneV2PaymentResponse> {
    try {
      const payment = await this.client.getPayment({ paymentId });
      return payment;
    } catch (error) {
      if (error instanceof Error && error.message.includes('payment')) {
        throw new Error('결제 정보를 찾을 수 없습니다.');
      }
      console.error('❌ PortOne V2 결제 조회 실패:', error);
      throw new Error('결제 정보를 가져올 수 없습니다.');
    }
  }

  /**
   * 결제 검증 (V2 스타일)
   */
  verifyPayment(payment: PortOneV2PaymentResponse, expectedAmount: number, expectedCurrency: string = 'KRW'): boolean {
    // 실연동 시에 테스트 채널키로 변조되어 결제되지 않도록 검증
    // if (payment.channel.type !== "LIVE") return false;
    
    if (!payment.customData) return false;
    
    // customData에서 주문 정보 추출
    const customData = JSON.parse(payment.customData);
    const orderId = customData.orderId;
    
    if (!orderId) return false;
    
    return (
      payment.amount.total === expectedAmount &&
      payment.amount.currency === expectedCurrency
    );
  }

  /**
   * Webhook IP 화이트리스트 검증 (V2)
   */
  isWebhookFromPortOne(clientIp: string): boolean {
    const allowedIps = [
      '52.78.100.19',
      '52.78.48.223',
      '52.78.5.241',
      '52.78.5.242',
      '52.78.5.243',
      '52.78.5.244',
      '52.78.5.245',
      '52.78.5.246',
      '52.78.5.247',
      '52.78.5.248',
      '52.78.5.249',
      '52.78.5.250',
      '52.78.5.251',
      '52.78.5.252',
      '52.78.5.253',
      '52.78.5.254',
      '52.78.5.255',
    ];

    return allowedIps.includes(clientIp);
  }
}

export const portOneService = new PortOneService(); 