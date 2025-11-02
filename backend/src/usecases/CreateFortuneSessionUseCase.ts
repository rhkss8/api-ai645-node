/**
 * 운세 세션 생성 UseCase
 */
import { PrismaClient } from '@prisma/client';
import { IdGenerator } from '../utils/idGenerator';
import { FortuneSession } from '../entities/FortuneSession';
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';
import { IHongsiCreditRepository } from '../repositories/IHongsiCreditRepository';
import { FortuneCategory, SessionMode, FortuneProductType } from '../types/fortune';
import { FortuneProductService } from '../services/FortuneProductService';

export interface CreateSessionParams {
  userId: string;
  category: FortuneCategory;
  mode: SessionMode;
  userInput: string;
  paymentId?: string;        // 즉시 결제 완료 시 결제 ID
  useFreeHongsi?: boolean;   // 무료 홍시 사용 여부 (채팅형만)
  durationMinutes?: number;  // 채팅형 결제 시 시간 (5, 10, 30분)
}

export class CreateFortuneSessionUseCase {
  constructor(
    private readonly sessionRepository: IFortuneSessionRepository,
    private readonly hongsiCreditRepository: IHongsiCreditRepository,
    private readonly prisma: PrismaClient,
    private readonly productService: FortuneProductService,
  ) {}

  async execute(params: CreateSessionParams): Promise<FortuneSession> {
    const { userId, category, mode, userInput, paymentId, useFreeHongsi, durationMinutes } = params;

    // 문서형은 무조건 결제 필수
    if (mode === SessionMode.DOCUMENT) {
      if (!paymentId) {
        const product = this.productService.getProduct(
          FortuneProductType.DOCUMENT_REPORT,
          category,
        );
        throw new Error(
          `문서형 리포트는 결제가 필수입니다. (${product.finalAmount.toLocaleString()}원)`,
        );
      }

      // 결제 확인
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });

      if (!payment || payment.status !== 'COMPLETED') {
        throw new Error('유효한 결제 정보가 없습니다.');
      }

      if (payment.order.userId !== userId) {
        throw new Error('결제 정보가 일치하지 않습니다.');
      }

      // 결제된 문서형 세션 생성 (시간 제한 없음, 문서 생성 후 종료)
      const sessionId = IdGenerator.generateFortuneSessionId();
      const session = FortuneSession.create(
        sessionId,
        userId,
        category,
        mode,
        0, // 문서형은 시간 개념 없음
      );

      session.validate();
      return await this.sessionRepository.create(session);
    }

    // 채팅형: 결제 또는 무료 홍시 선택
    if (mode === SessionMode.CHAT) {
      // 기존 활성 세션 확인
      const existingSession = await this.sessionRepository.findActiveByUserIdAndCategory(
        userId,
        category,
      );

      if (existingSession && existingSession.isActive) {
        return existingSession;
      }

      let sessionTime = 0;

      // 결제 완료된 경우
      if (paymentId) {
        const payment = await this.prisma.payment.findUnique({
          where: { id: paymentId },
          include: { order: true },
        });

        if (!payment || payment.status !== 'COMPLETED') {
          throw new Error('유효한 결제 정보가 없습니다.');
        }

        if (payment.order.userId !== userId) {
          throw new Error('결제 정보가 일치하지 않습니다.');
        }

        // 결제 상품 정보 조회
        // durationMinutes가 없으면 에러 (채팅형 결제는 시간 필수: 5, 10, 30분)
        if (!durationMinutes) {
          throw new Error('채팅형 결제는 시간 선택이 필수입니다. (5, 10, 30분 중 선택)');
        }

        // durationMinutes 값 검증 (5, 10, 30분만 허용)
        if (![5, 10, 30].includes(durationMinutes)) {
          throw new Error('시간은 5분, 10분, 30분 중에서만 선택 가능합니다.');
        }

        const product = this.productService.getProduct(
          FortuneProductType.CHAT_SESSION,
          category,
          durationMinutes,
        );
        sessionTime = product.duration || durationMinutes * 60;
      } else if (useFreeHongsi) {
        // 무료 홍시 사용 (durationMinutes 무시, 항상 2분 고정)
        const isFreeUsed = await this.hongsiCreditRepository.isFreeHongsiUsedToday(userId);
        if (isFreeUsed) {
          throw new Error('오늘 무료 홍시를 이미 사용했습니다.');
        }

        sessionTime = 120; // 무료 홍시는 항상 2분(120초) 고정
        await this.hongsiCreditRepository.useFreeHongsi(userId);
      } else {
        // 결제도 안 했고 무료 홍시도 선택 안 함
        // 기본 10분 기준으로 안내
        const sampleProduct = this.productService.getProduct(
          FortuneProductType.CHAT_SESSION,
          category,
          10, // 기본 10분으로 안내
        );
        throw new Error(
          `채팅 상담을 시작하려면 결제(5분: ${sampleProduct.finalAmount.toLocaleString()}원부터) 또는 무료 홍시를 선택해주세요.`,
        );
      }

      // 새 세션 생성
      const sessionId = IdGenerator.generateFortuneSessionId();
      const session = FortuneSession.create(
        sessionId,
        userId,
        category,
        mode,
        sessionTime,
      );

      session.validate();
      return await this.sessionRepository.create(session);
    }

    throw new Error('유효하지 않은 세션 모드입니다.');
  }
}
