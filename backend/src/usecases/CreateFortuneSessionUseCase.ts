/**
 * 운세 세션 생성 UseCase
 */
import { PrismaClient, PaymentStatus } from '@prisma/client';
import { IdGenerator } from '../utils/idGenerator';
import { FortuneSession } from '../entities/FortuneSession';
import { IFortuneSessionRepository } from '../repositories/IFortuneSessionRepository';
import { IHongsiCreditRepository } from '../repositories/IHongsiCreditRepository';
import { FortuneCategory, SessionMode, FortuneProductType } from '../types/fortune';
import { FortuneProductService } from '../services/FortuneProductService';
import { PaymentService } from '../services/PaymentService';
import { DocumentFortuneUseCase } from './DocumentFortuneUseCase';

export interface CreateSessionParams {
  userId: string;
  category: FortuneCategory;
  formType?: string;         // ASK, DAILY, TRADITIONAL
  mode: SessionMode;
  userInput: string;
  userData?: Record<string, any>; // 구조화된 운세 데이터 (이름, 생년월일, 성별 등)
  paymentId?: string;        // 우리 DB의 Payment.id
  portOnePaymentId?: string; // PortOne에서 반환한 paymentId (로컬: 콜백에서 전달, 실운영: 웹훅에서 저장)
  useFreeHongsi?: boolean;   // 무료 홍시 사용 여부 (채팅형만)
  durationMinutes?: number;  // 채팅형 결제 시 시간 (5, 10, 30분)
}

export class CreateFortuneSessionUseCase {
  constructor(
    private readonly sessionRepository: IFortuneSessionRepository,
    private readonly hongsiCreditRepository: IHongsiCreditRepository,
    private readonly prisma: PrismaClient,
    private readonly productService: FortuneProductService,
    private readonly paymentService: PaymentService,
    private readonly documentUseCase: DocumentFortuneUseCase, // 문서 생성 UseCase 추가
  ) {}

  async execute(params: CreateSessionParams): Promise<FortuneSession> {
    const { userId, category, formType, mode, userInput, userData, paymentId, portOnePaymentId, useFreeHongsi, durationMinutes } = params;

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

      if (!payment) {
        throw new Error('유효한 결제 정보가 없습니다.');
      }

      if (payment.order.userId !== userId) {
        throw new Error('결제 정보가 일치하지 않습니다.');
      }

      // 결제 상태가 PENDING이면 PortOne API로 결제 완료 여부 확인 (로컬: 폴링, 실운영: 웹훅)
      if (payment.status === 'PENDING') {
        // portOnePaymentId가 없으면 에러
        if (!portOnePaymentId) {
          throw new Error('PortOne 결제 ID가 필요합니다. 결제를 완료해주세요.');
        }

        // 로컬: 짧은 폴링으로 결제 완료 확인 (최대 5초, 5회 시도)
        const maxRetries = 5;
        const retryDelay = 1000; // 1초
        let verifyResult: { success: boolean; status?: PaymentStatus } = { success: false };

        console.log(`[세션 생성] 결제 상태 폴링 시작: paymentId=${paymentId}, portOnePaymentId=${portOnePaymentId}`);

        for (let i = 0; i < maxRetries; i++) {
          console.log(`[세션 생성] 폴링 시도 ${i + 1}/${maxRetries}`);
          verifyResult = await this.paymentService.verifyAndUpdatePaymentStatus(paymentId, portOnePaymentId);

          if (verifyResult.success && verifyResult.status === 'COMPLETED') {
            console.log(`[세션 생성] 결제 완료 확인됨 (시도 ${i + 1})`);
            break;
          }

          // 마지막 시도가 아니면 대기
          if (i < maxRetries - 1) {
            console.log(`[세션 생성] 결제 대기 중... ${retryDelay}ms 후 재시도`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }

        if (!verifyResult.success || verifyResult.status !== 'COMPLETED') {
          // 로컬: PENDING 상태면 프론트엔드에서 폴링하도록 안내
          console.warn(`[세션 생성] 폴링 실패: paymentId=${paymentId}, status=${verifyResult.status}`);
          throw new Error(
            '결제가 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요. (프론트엔드에서 폴링 권장)',
          );
        }

        // Payment 상태가 업데이트되었으므로 다시 조회
        const updatedPayment = await this.prisma.payment.findUnique({
          where: { id: paymentId },
          include: { order: true },
        });

        if (!updatedPayment || updatedPayment.status !== 'COMPLETED') {
          throw new Error('결제 상태 확인에 실패했습니다.');
        }

        console.log(`[세션 생성] 결제 상태 확인 완료: ${paymentId} -> COMPLETED`);
      } else if (payment.status !== 'COMPLETED') {
        throw new Error('결제가 완료되지 않았거나 취소되었습니다.');
      }

      // 결제된 문서형 세션 생성 (시간 제한 없음, 문서 생성 후 종료)
      const sessionId = IdGenerator.generateFortuneSessionId();
      const session = FortuneSession.create(
        sessionId,
        userId,
        category,
        mode,
        0, // 문서형은 시간 개념 없음
        formType as any,
        userInput,
        userData,
      );

      session.validate();
      const createdSession = await this.sessionRepository.create(session);

      // Order의 metadata에 sessionId 저장 (세션과 주문 연결)
      if (paymentId) {
        try {
          const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { order: true },
          });
          
          if (payment?.order) {
            const orderMetadata = (payment.order.metadata as any) || {};
            orderMetadata.sessionId = createdSession.id; // 세션 ID 저장
            
            await this.prisma.order.update({
              where: { id: payment.order.id },
              data: {
                metadata: orderMetadata,
              },
            });
            console.log(`[세션 생성] Order metadata에 sessionId 저장: orderId=${payment.order.id}, sessionId=${createdSession.id}`);
          }
        } catch (orderError: any) {
          console.error(`[세션 생성] Order metadata 업데이트 실패: sessionId=${sessionId}`, orderError);
        }
      }

      // 문서 생성 및 저장 (결제 완료 후 즉시 생성)
      // 결제할 때마다 새로운 문서가 생성되어야 함
      try {
        console.log(`[세션 생성] 문서 생성 시작: sessionId=${sessionId}, category=${category}`);
        const { documentResponse, documentId } = await this.documentUseCase.execute(
          userId,
          category,
          userInput,
          userData,
        );
        
        console.log(`[세션 생성] 문서 생성 완료: sessionId=${sessionId}, documentId=${documentId}`);
        
        if (documentId) {
          
          // Order의 metadata에 documentId 저장 (세션과 문서 연결)
          if (paymentId) {
            try {
              const payment = await this.prisma.payment.findUnique({
                where: { id: paymentId },
                include: { order: true },
              });
              
              if (payment?.order) {
                const orderMetadata = (payment.order.metadata as any) || {};
                orderMetadata.documentId = documentId; // 문서 ID 저장
                orderMetadata.sessionId = createdSession.id; // 세션 ID도 함께 저장 (이미 저장했지만 확실히)
                
                await this.prisma.order.update({
                  where: { id: payment.order.id },
                  data: {
                    metadata: orderMetadata,
                  },
                });
                console.log(`[세션 생성] Order metadata에 documentId 저장: orderId=${payment.order.id}, documentId=${documentId}`);
              }
              
              // PaymentDetail에 documentId 연결 (이미 PaymentDetail이 있으면 업데이트, 없으면 생성)
              const existingPaymentDetail = await this.prisma.paymentDetail.findFirst({
                where: { 
                  paymentId,
                  sessionId: createdSession.id,
                },
              });
              
              if (existingPaymentDetail) {
                // 기존 PaymentDetail 업데이트
                await this.prisma.paymentDetail.update({
                  where: { id: existingPaymentDetail.id },
                  data: { documentId },
                });
                console.log(`[세션 생성] PaymentDetail 업데이트: paymentDetailId=${existingPaymentDetail.id}, documentId=${documentId}`);
              } else {
                // PaymentDetail이 아직 없으면 생성 (문서형 세션은 PaymentDetail이 있어야 함)
                // 문서의 유효기간을 가져오기 위해 문서 조회
                const documentForExpiry = await this.prisma.documentResult.findUnique({
                  where: { id: documentId },
                  select: { expiresAt: true },
                });
                
                await this.prisma.paymentDetail.create({
                  data: {
                    paymentId,
                    sessionId: createdSession.id,
                    documentId,
                    sessionType: 'DOCUMENT',
                    category,
                    expiredAt: documentForExpiry?.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 문서 유효기간 또는 기본 1년
                  },
                });
                console.log(`[세션 생성] PaymentDetail 생성: paymentId=${paymentId}, documentId=${documentId}`);
              }
            } catch (pdError: any) {
              console.error(`[세션 생성] PaymentDetail 연결 실패: sessionId=${sessionId}`, pdError);
              // PaymentDetail 연결 실패해도 계속 진행
            }
          }
        }
      } catch (error: any) {
        console.error(`[세션 생성] 문서 생성 실패: sessionId=${sessionId}`, error);
        // 문서 생성 실패해도 세션은 생성됨 (결과 조회 시 재시도 가능)
      }

      return createdSession;
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

        if (!payment) {
          throw new Error('유효한 결제 정보가 없습니다.');
        }

        if (payment.order.userId !== userId) {
          throw new Error('결제 정보가 일치하지 않습니다.');
        }

        // 결제 상태가 PENDING이면 PortOne API로 결제 완료 여부 확인 (로컬: 폴링, 실운영: 웹훅)
        if (payment.status === 'PENDING') {
          // portOnePaymentId가 없으면 에러
          if (!portOnePaymentId) {
            throw new Error('PortOne 결제 ID가 필요합니다. 결제를 완료해주세요.');
          }

          // 로컬: 짧은 폴링으로 결제 완료 확인 (최대 5초, 5회 시도)
          const maxRetries = 5;
          const retryDelay = 1000; // 1초
          let verifyResult: { success: boolean; status?: PaymentStatus } = { success: false };

          console.log(`[세션 생성] 결제 상태 폴링 시작: paymentId=${paymentId}, portOnePaymentId=${portOnePaymentId}`);

          for (let i = 0; i < maxRetries; i++) {
            console.log(`[세션 생성] 폴링 시도 ${i + 1}/${maxRetries}`);
            verifyResult = await this.paymentService.verifyAndUpdatePaymentStatus(paymentId, portOnePaymentId);

            if (verifyResult.success && verifyResult.status === 'COMPLETED') {
              console.log(`[세션 생성] 결제 완료 확인됨 (시도 ${i + 1})`);
              break;
            }

            // 마지막 시도가 아니면 대기
            if (i < maxRetries - 1) {
              console.log(`[세션 생성] 결제 대기 중... ${retryDelay}ms 후 재시도`);
              await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
          }

          if (!verifyResult.success || verifyResult.status !== 'COMPLETED') {
            // 로컬: PENDING 상태면 프론트엔드에서 폴링하도록 안내
            console.warn(`[세션 생성] 폴링 실패: paymentId=${paymentId}, status=${verifyResult.status}`);
            throw new Error(
              '결제가 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요. (프론트엔드에서 폴링 권장)',
            );
          }

          // Payment 상태가 업데이트되었으므로 다시 조회
          const updatedPayment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { order: true },
          });

          if (!updatedPayment || updatedPayment.status !== 'COMPLETED') {
            throw new Error('결제 상태 확인에 실패했습니다.');
          }

          console.log(`[세션 생성] 결제 상태 확인 완료: ${paymentId} -> COMPLETED`);
        } else if (payment.status !== 'COMPLETED') {
          throw new Error('결제가 완료되지 않았거나 취소되었습니다.');
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
              formType as any,
              userInput,
              userData,
            );

            session.validate();
            return await this.sessionRepository.create(session);
    }

    throw new Error('유효하지 않은 세션 모드입니다.');
  }
}
