/**
 * 포포춘 운세 컨트롤러
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ApiResponse } from '../types/common';
import { FortuneApiResponse, FortuneCategory, SessionMode, FormType } from '../types/fortune';
import { CreateFortuneSessionUseCase } from '../usecases/CreateFortuneSessionUseCase';
import { ChatFortuneUseCase } from '../usecases/ChatFortuneUseCase';
import { DocumentFortuneUseCase } from '../usecases/DocumentFortuneUseCase';
import { GetSessionUseCase } from '../usecases/GetSessionUseCase';
import { GetDocumentUseCase } from '../usecases/GetDocumentUseCase';
import { PurchaseHongsiUseCase } from '../usecases/PurchaseHongsiUseCase';
import { ExtendSessionTimeUseCase } from '../usecases/ExtendSessionTimeUseCase';
import { GetFortuneStatisticsUseCase } from '../usecases/GetFortuneStatisticsUseCase';
import { PrepareFortunePaymentUseCase } from '../usecases/PrepareFortunePaymentUseCase';
import { GetFortunePaymentsUseCase } from '../usecases/GetFortunePaymentsUseCase';
import { GetFortunePaymentDetailUseCase } from '../usecases/GetFortunePaymentDetailUseCase';
import { RegenerateDocumentUseCase } from '../usecases/RegenerateDocumentUseCase';
import { FortuneProductService } from '../services/FortuneProductService';
import { ResultTokenService } from '../services/ResultTokenService';
import { PaymentService } from '../services/PaymentService';
import { HongsiUnit, FortuneProductType } from '../types/fortune';

export class FortuneController {
  constructor(
    private readonly createSessionUseCase: CreateFortuneSessionUseCase,
    private readonly chatUseCase: ChatFortuneUseCase,
    private readonly documentUseCase: DocumentFortuneUseCase,
    private readonly getSessionUseCase: GetSessionUseCase,
    private readonly getDocumentUseCase: GetDocumentUseCase,
    private readonly purchaseHongsiUseCase: PurchaseHongsiUseCase,
    private readonly extendSessionTimeUseCase: ExtendSessionTimeUseCase,
    private readonly getStatisticsUseCase: GetFortuneStatisticsUseCase,
    private readonly preparePaymentUseCase: PrepareFortunePaymentUseCase,
    private readonly getPaymentsUseCase: GetFortunePaymentsUseCase,
    private readonly getPaymentDetailUseCase: GetFortunePaymentDetailUseCase,
    private readonly regenerateDocumentUseCase: RegenerateDocumentUseCase,
    private readonly paymentService: PaymentService,
    private readonly productService: FortuneProductService,
    private readonly resultTokenService: ResultTokenService,
  ) {}

  /**
   * 세션 생성
   * POST /api/fortune/session
   * 
   * 요청 본문:
   * - category: FortuneCategory (필수)
   * - mode: SessionMode (필수)
   * - userInput: string (필수)
   * - paymentId?: string (선택, 채팅형/문서형 즉시 결제 시)
   * - useFreeHongsi?: boolean (선택, 채팅형만, 무료 홍시 2분, 하루 1회, paymentId와 동시 사용 불가)
   * - durationMinutes?: number (선택, 채팅형 결제 시 필수: 5/10/30분, 무료 홍시 사용 시 무시됨)
   */
  createSession = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { category, formType, mode, userInput, userData, paymentId, portOnePaymentId, useFreeHongsi, durationMinutes } = req.body;

      if (!category || !formType || !mode || !userInput) {
        throw new Error('카테고리, 폼타입, 모드, 사용자 입력은 필수입니다.');
      }

      // formType 검증 (ASK, DAILY, TRADITIONAL만 허용)
      if (formType && !['ASK', 'DAILY', 'TRADITIONAL'].includes(formType)) {
        throw new Error(`formType은 ASK, DAILY, TRADITIONAL 중 하나여야 합니다. (받은 값: ${formType})`);
      }

      // 채팅형 검증
      if (mode === SessionMode.CHAT) {
        // 결제와 무료 홍시 동시 선택 불가
        if (paymentId && useFreeHongsi) {
          throw new Error('결제와 무료 홍시를 동시에 선택할 수 없습니다.');
        }

        // 결제일 경우: durationMinutes 필수 (5, 10, 30분)
        if (paymentId && !durationMinutes) {
          throw new Error('채팅형 결제는 시간 선택이 필수입니다. (5, 10, 30분)');
        }

        // 결제일 경우: durationMinutes 값 검증 (5, 10, 30분만 허용)
        if (paymentId && durationMinutes && ![5, 10, 30].includes(durationMinutes)) {
          throw new Error('시간은 5분, 10분, 30분 중에서만 선택 가능합니다.');
        }

        // 무료 홍시일 경우: durationMinutes 불필요 (자동으로 2분)
        // durationMinutes가 전달되어도 무시됨 (2분 고정)
      }

      const session = await this.createSessionUseCase.execute({
        userId: user.sub,
        category: category as FortuneCategory,
        formType: formType as any,
        mode: mode as SessionMode,
        userInput,
        userData,
        paymentId,
        portOnePaymentId,
        useFreeHongsi,
        durationMinutes,
      });

      // 결과 토큰 발급 (만료 시간은 ResultTokenService에서 설정)
      const resultToken = this.resultTokenService.sign({
        sessionId: session.id,
        userId: user.sub,
        category: category as FortuneCategory,
        formType: formType as FormType,
        mode: mode as SessionMode,
      });

      const response: FortuneApiResponse = {
        success: true,
        data: {
          sessionId: session.id,
          category: session.category,
          formType: formType as FormType,
          mode: session.mode,
          remainingTime: session.remainingTime,
          isActive: session.isActive,
          expiresAt: session.expiresAt.toISOString(),
          isPaid: !!paymentId,
          resultToken,
        },
        remainingTime: session.remainingTime,
        isFreeHongsi: useFreeHongsi && session.remainingTime === 120,
        message: '세션이 생성되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    },
  );

  /**
   * 결제 준비
   * POST /api/fortune/payment/prepare
   */
  preparePayment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      try {
        console.log('[결제 준비] 요청 시작:', {
          userId: (req as any).user?.sub,
          body: req.body,
          payMethod: req.body?.payMethod,
          easyPayProvider: req.body?.easyPayProvider,
        });

        const user = (req as any).user;
        if (!user) {
          console.error('[결제 준비] 인증 실패: 사용자 정보 없음');
          throw new Error('로그인이 필요합니다.');
        }

        const { productType, category, durationMinutes, payMethod, easyPayProvider } = req.body;

        if (!productType || !category) {
          console.error('[결제 준비] 필수 파라미터 누락:', { productType, category });
          throw new Error('상품 타입과 카테고리는 필수입니다.');
        }

        // 채팅형일 경우 durationMinutes 필수
        if (productType === FortuneProductType.CHAT_SESSION && !durationMinutes) {
          console.error('[결제 준비] 채팅형 시간 누락:', { productType, durationMinutes });
          throw new Error('채팅형은 시간 선택이 필수입니다. (5, 10, 30분)');
        }

        console.log('[결제 준비] UseCase 실행 시작:', {
          userId: user.sub,
          productType,
          category,
          durationMinutes,
          payMethod,
          easyPayProvider,
        });

        const result = await this.preparePaymentUseCase.execute(
          user.sub,
          productType as FortuneProductType,
          category as FortuneCategory,
          durationMinutes,
          payMethod, // 결제 방법 전달
          easyPayProvider, // 간편결제 제공자 전달
        );

        console.log('[결제 준비] 성공:', {
          orderId: result.orderId,
          paymentId: result.paymentId,
          amount: result.amount,
        });

        const response: ApiResponse = {
          success: true,
          data: result,
          message: '결제 준비가 완료되었습니다.',
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error: any) {
        console.error('[결제 준비] 에러 발생:', {
          error: error?.message || error,
          stack: error?.stack,
          userId: (req as any).user?.sub,
          body: req.body,
        });
        throw error; // asyncHandler가 처리
      }
    },
  );

  /**
   * 상품 정보 조회 (카테고리별)
   * GET /api/fortune/products/:category
   */
  getProducts = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { category } = req.params;

      if (!category) {
        throw new Error('카테고리는 필수입니다.');
      }

      const products = this.productService.getProductsByCategory(
        category as FortuneCategory,
      );

      const response: ApiResponse = {
        success: true,
        data: products,
        message: '상품 정보 조회가 완료되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * 모든 상품 정보 조회
   * GET /api/fortune/products
   */
  getAllProducts = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const allProducts = this.productService.getAllProducts();

      const response: ApiResponse = {
        success: true,
        data: allProducts,
        message: '전체 상품 정보 조회가 완료되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * 채팅형 메시지 전송
   * POST /api/fortune/chat
   */
  sendChatMessage = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { sessionId, message } = req.body;

      if (!sessionId || !message) {
        throw new Error('세션 ID와 메시지는 필수입니다.');
      }

      const result = await this.chatUseCase.execute(sessionId, message);

      const response: FortuneApiResponse = {
        success: true,
        data: result.response,
        remainingTime: result.session.remainingTime,
        message: '응답이 생성되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * 문서형 리포트 생성
   * POST /api/fortune/document
   */
  createDocument = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { category, userInput } = req.body;

      if (!category || !userInput) {
        throw new Error('카테고리와 사용자 입력은 필수입니다.');
      }

      const { documentResponse: document } = await this.documentUseCase.execute(
        user.sub,
        category as FortuneCategory,
        userInput,
      );

      const response: ApiResponse = {
        success: true,
        data: document,
        message: '문서가 생성되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    },
  );

  /**
   * 세션 조회
   * GET /api/fortune/session/:id
   */
  getSession = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { id } = req.params;

      const sessionData = await this.getSessionUseCase.execute(id as string, user.sub as string);

      const response: FortuneApiResponse = {
        success: true,
        data: sessionData,
        remainingTime: sessionData.remainingTime,
        message: '세션 조회가 완료되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * 문서 조회
   * GET /api/fortune/document/:id
   */
  getDocument = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { id } = req.params;

      const documentData = await this.getDocumentUseCase.execute(id as string, user.sub as string);

      const response: ApiResponse = {
        success: true,
        data: documentData,
        message: '문서 조회가 완료되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * 홍시 구매
   * POST /api/fortune/hongsi/purchase
   */
  purchaseHongsi = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { unit, sessionId } = req.body;

      if (!unit) {
        throw new Error('홍시 단위는 필수입니다.');
      }

      const result = await this.purchaseHongsiUseCase.execute(
        user.sub,
        unit as HongsiUnit,
        sessionId,
      );

      const response: FortuneApiResponse = {
        success: true,
        data: {
          purchasedMinutes: result.minutes,
          totalAvailableTime: result.totalAvailableTime,
        },
        remainingTime: result.totalAvailableTime,
        message: `${result.minutes}분 홍시 구매가 완료되었습니다.`,
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * 세션 시간 연장
   * POST /api/fortune/session/:id/extend
   */
  extendSessionTime = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { id } = req.params;
      const { additionalSeconds } = req.body;

      if (!additionalSeconds || additionalSeconds <= 0) {
        throw new Error('추가할 시간(초)은 필수이며 0보다 커야 합니다.');
      }

      const result = await this.extendSessionTimeUseCase.execute(
        id as string,
        user.sub as string,
        additionalSeconds as number,
      );

      const response: FortuneApiResponse = {
        success: true,
        data: result,
        remainingTime: result.remainingTime,
        message: '세션 시간이 연장되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * 운세 통계 조회
   * GET /api/fortune/statistics
   */
  getStatistics = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      // 사용자별 통계 조회 (관리자는 전체 통계도 가능하도록 확장 가능)
      const statistics = await this.getStatisticsUseCase.execute(user.sub);

      const response: ApiResponse = {
        success: true,
        data: statistics,
        message: '통계 조회가 완료되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * 결제 웹훅 (PortOne 서버→서버)
   * POST /api/v1/fortune/payment/webhook
   */
  paymentWebhook = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // 웹훅 요청 로깅 (디버깅용)
      console.log('🔔 웹훅 요청 수신:', {
        method: req.method,
        url: req.url,
        headers: {
          'x-webhook-secret': req.headers['x-webhook-secret'],
          'x-portone-secret': req.headers['x-portone-secret'],
          'x-portone-signature': req.headers['x-portone-signature'],
          'authorization': req.headers['authorization'],
        },
        body: req.body,
        ip: req.ip,
      });

      // 최소 유효성 검사
      const { orderId, paymentId, amount, status, payMethod, easyPayProvider } = req.body || {};
      if (!orderId || !paymentId || typeof amount !== 'number' || !status) {
        console.error('❌ 웹훅 페이로드 검증 실패:', { orderId, paymentId, amount, status });
        res.status(400).json({ success: false, error: 'INVALID_WEBHOOK_PAYLOAD' });
        return;
      }

      // PortOne API로 결제 정보 조회하여 실제 결제 방법 추출 (웹훅 body보다 정확함)
      let extractedPayMethod: string | undefined = payMethod;
      let extractedEasyPayProvider: string | undefined = easyPayProvider;
      
      try {
        const portOnePayment = await this.paymentService.getPortOnePaymentInfo(paymentId);
        if (portOnePayment) {
          // PortOne 응답에서 결제 방법 추출
          if (portOnePayment.channel?.payMethod) {
            extractedPayMethod = portOnePayment.channel.payMethod;
            console.log(`[웹훅] PortOne API에서 payMethod 추출: ${extractedPayMethod}`);
          } else if (portOnePayment.channel?.easyPay?.provider) {
            extractedEasyPayProvider = portOnePayment.channel.easyPay.provider;
            console.log(`[웹훅] PortOne API에서 easyPayProvider 추출: ${extractedEasyPayProvider}`);
          }
        }
      } catch (error) {
        console.warn(`[웹훅] PortOne API 조회 실패 (웹훅 body 값 사용):`, error);
        // PortOne API 조회 실패해도 웹훅 body의 값 사용
      }

      // 간이 서명 검증 (비밀키 헤더 비교)
      // PortOne V2는 여러 헤더 이름을 사용할 수 있음
      const secretHeader = (
        req.headers['x-webhook-secret'] || 
        req.headers['x-portone-secret'] ||
        req.headers['x-portone-signature']
      ) as string | undefined;
      const expected = process.env.PORTONE_WEBHOOK_SECRET;
      
      if (!expected) {
        console.error('❌ PORTONE_WEBHOOK_SECRET 환경변수가 설정되지 않았습니다.');
        res.status(500).json({ success: false, error: 'WEBHOOK_SECRET_NOT_CONFIGURED' });
        return;
      }

      if (!secretHeader || secretHeader !== expected) {
        console.error('❌ 웹훅 시크릿 검증 실패:', {
          received: secretHeader ? '***' : '(없음)',
          expected: expected ? '***' : '(없음)',
        });
        res.status(401).json({ success: false, error: 'PAYMENT_UNVERIFIED' });
        return;
      }

      // 결제 확정 처리 (결제 방법 정보 포함)
      console.log('✅ 웹훅 검증 통과, 결제 확정 처리 시작:', { 
        orderId, 
        paymentId, 
        amount, 
        status, 
        payMethod: extractedPayMethod, 
        easyPayProvider: extractedEasyPayProvider 
      });
      const ok = await this.paymentService.confirmPaymentByWebhook({ 
        orderId, 
        paymentId, 
        amount, 
        status,
        payMethod: extractedPayMethod, // PortOne API에서 추출한 결제 방법 (우선)
        easyPayProvider: extractedEasyPayProvider, // PortOne API에서 추출한 간편결제 제공자 (우선)
      });
      if (!ok.success) {
        console.error('❌ 결제 확정 처리 실패:', { orderId, paymentId });
        res.status(400).json({ success: false, error: 'PAYMENT_UNVERIFIED' });
        return;
      }

      console.log('✅ 웹훅 처리 완료:', { orderId, paymentId });
      res.status(200).json({ success: true });
    },
  );

  /**
   * 결제 상태 확인 (프론트엔드 폴링용)
   * GET /api/v1/fortune/payment/:paymentId/status
   */
  getPaymentStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        // authenticateAccess 미들웨어가 이미 401을 보냈을 수 있으므로 확인
        if (!res.headersSent) {
          res.status(401).json({
            success: false,
            error: '로그인이 필요합니다.',
            message: '다시 로그인해주세요.',
            errorCode: 'UNAUTHORIZED',
          });
        }
        return;
      }

      const { paymentId } = req.params;
      if (!paymentId) {
        res.status(400).json({ success: false, error: 'PAYMENT_ID_REQUIRED' });
        return;
      }

      // Payment 조회
      const payment = await this.paymentService.getPaymentById(paymentId);
      if (!payment) {
        res.status(404).json({ success: false, error: 'PAYMENT_NOT_FOUND' });
        return;
      }

      // 사용자 확인
      if (payment.order.userId !== user.sub) {
        res.status(403).json({ success: false, error: 'PAYMENT_ACCESS_DENIED' });
        return;
      }

      // 캐시 방지 헤더 추가 (304 응답 방지)
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
      });

      res.status(200).json({
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          amount: payment.amount,
          paidAt: payment.paidAt,
        },
      });
    },
  );

  /**
   * 결제 취소
   * POST /api/v1/fortune/payment/:paymentId/cancel
   */
  cancelPayment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          success: false,
          error: '로그인이 필요합니다.',
          errorCode: 'UNAUTHORIZED',
        });
        return;
      }

      const { paymentId } = req.params;
      if (!paymentId) {
        res.status(400).json({ success: false, error: 'PAYMENT_ID_REQUIRED' });
        return;
      }

      const { reason } = req.body; // 취소 사유 (선택)

      try {
        const prisma = new (require('@prisma/client').PrismaClient)();
        const cancelPaymentUseCase = new (require('../usecases/CancelFortunePaymentUseCase').CancelFortunePaymentUseCase)(prisma);
        
        const result = await cancelPaymentUseCase.execute({
          paymentId,
          userId: user.sub,
          reason,
        });

        if (!result.success) {
          const statusCode = result.error === 'PAYMENT_NOT_FOUND' ? 404 :
                            result.error === 'PAYMENT_ACCESS_DENIED' ? 403 :
                            result.error === 'ALREADY_CANCELLED' || result.error === 'CANNOT_CANCEL' ? 400 : 500;
          
          res.status(statusCode).json({
            success: false,
            error: result.error,
            message: result.message,
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: {
            paymentId: result.paymentId,
            orderId: result.orderId,
          },
          message: result.message,
        });
      } catch (error: any) {
        console.error('[결제 취소] 에러:', error);
        res.status(500).json({
          success: false,
          error: 'CANCEL_FAILED',
          message: '결제 취소 처리 중 오류가 발생했습니다.',
        });
      }
    },
  );

  /**
   * 결과 토큰으로 결과 조회
   * GET /api/v1/fortune/result/:token
   */
  getResultByToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { token } = req.params;
      if (!token) {
        res.status(400).json({ success: false, error: 'TOKEN_INVALID' });
        return;
      }
      try {
        console.log('[결과 조회] 토큰 검증 시작:', { token: token.substring(0, 20) + '...', tokenLength: token.length });
        const payload = this.resultTokenService.verify(token);
        console.log('[결과 조회] 토큰 검증 성공:', { sessionId: payload.sessionId, userId: payload.userId });
        
        // 세션 조회 (userInput, userData 포함)
        const prisma = new (require('@prisma/client').PrismaClient)();
        const sessionRecord = await prisma.fortuneSession.findUnique({
          where: { id: payload.sessionId },
        });

        if (!sessionRecord) {
          res.status(404).json({ success: false, error: 'SESSION_NOT_FOUND' });
          return;
        }

        if (sessionRecord.userId !== payload.userId) {
          res.status(403).json({ success: false, error: 'SESSION_ACCESS_DENIED' });
          return;
        }

        // 최근 채팅 N개 조회
        const chats = await prisma.conversationLog.findMany({
          where: { sessionId: payload.sessionId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        // 문서형 세션인 경우: 문서 결과 조회 또는 생성
        let document: any = null;
        if (sessionRecord.mode === 'DOCUMENT') {
          try {
            // 1. PaymentDetail을 통해 documentId 찾기 (우선순위)
            const paymentDetail = await prisma.paymentDetail.findFirst({
              where: { sessionId: payload.sessionId },
              select: { documentId: true },
            });

            if (paymentDetail?.documentId) {
              // PaymentDetail에 documentId가 있으면 해당 문서 조회
              document = await prisma.documentResult.findUnique({
                where: { id: paymentDetail.documentId },
              });
            }

            // 2. Order의 metadata에서 documentId 찾기 (세션 ID로 Order 찾기)
            if (!document) {
              // PaymentDetail을 먼저 조회하여 paymentId 찾기
              const paymentDetail = await prisma.paymentDetail.findFirst({
                where: {
                  sessionId: payload.sessionId,
                },
                select: {
                  paymentId: true,
                  documentId: true,
                },
              });
              
              // PaymentDetail에서 documentId가 있으면 바로 사용
              if (paymentDetail?.documentId) {
                document = await prisma.documentResult.findUnique({
                  where: { id: paymentDetail.documentId },
                });
              }
              
              // PaymentDetail에서 paymentId로 Order 찾기
              let order = null;
              if (paymentDetail?.paymentId && !document) {
                order = await prisma.order.findFirst({
                  where: {
                    userId: payload.userId,
                    payment: {
                      id: paymentDetail.paymentId,
                    },
                  },
                  include: {
                    payment: true,
                  },
                });
              }
              
              // Order를 찾지 못하면 metadata에서 직접 찾기
              if (!order) {
                const orderByMetadata = await prisma.order.findFirst({
                  where: {
                    userId: payload.userId,
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 10, // 최근 10개 주문 중에서 찾기
                });
                
                // 최근 주문들의 metadata를 확인하여 sessionId가 일치하는 것 찾기
                const orders = await prisma.order.findMany({
                  where: {
                    userId: payload.userId,
                    createdAt: {
                      gte: new Date(sessionRecord.createdAt.getTime() - 60000), // 세션 생성 1분 이내 주문
                    },
                  },
                  orderBy: { createdAt: 'desc' },
                  take: 5,
                });
                
                for (const ord of orders) {
                  const meta = ord.metadata as any;
                  if (meta?.sessionId === payload.sessionId && meta?.documentId) {
                    document = await prisma.documentResult.findUnique({
                      where: { id: meta.documentId },
                    });
                    if (document) break;
                  }
                }
              } else if (order.metadata) {
                const metadata = order.metadata as any;
                if (metadata.documentId) {
                  document = await prisma.documentResult.findUnique({
                    where: { id: metadata.documentId },
                  });
                }
              }
            }
            
            // 3. PaymentDetail에 documentId가 없고 Order metadata에도 없으면 세션 생성 시점에 생성된 문서 찾기
            if (!document) {
              // 세션 생성 시점에 생성된 문서는 같은 userId, category, createdAt이 비슷한 것으로 찾기
              document = await prisma.documentResult.findFirst({
                where: { 
                  userId: payload.userId, 
                  category: payload.category,
                  createdAt: {
                    gte: new Date(sessionRecord.createdAt.getTime() - 10000), // 세션 생성 10초 이내
                    lte: new Date(sessionRecord.createdAt.getTime() + 30000), // 세션 생성 30초 이후까지 허용 (GPT 생성 시간 고려)
                  },
                },
                orderBy: { createdAt: 'desc' },
              });
            }

            // 3. 문서가 없으면 GPT로 생성 (세션 생성 시 문서 생성 실패한 경우)
            if (!document && sessionRecord.userInput) {
              console.log('[결과 조회] 문서가 없어 GPT로 생성 시작:', { sessionId: payload.sessionId });
              try {
                const { documentResponse, documentId } = await this.documentUseCase.execute(
                  payload.userId,
                  payload.category,
                  sessionRecord.userInput || '',
                  sessionRecord.userData as Record<string, any> | undefined,
                );

                // 생성된 문서는 DB에 저장되므로, documentId로 조회
                if (documentId) {
                  document = await prisma.documentResult.findUnique({
                    where: { id: documentId },
                  });
                }
              } catch (error: any) {
                console.error('[결과 조회] GPT 문서 생성 실패:', error);
                // 문서 생성 실패 시 에러 응답 반환
                const errorMessage = error?.message || '운세 리포트 생성에 실패했습니다.';
                const errorCode = error?.status === 429 ? 'AI_QUOTA_EXCEEDED' : 'AI_GENERATION_FAILED';
                
                res.status(500).json({
                  success: false,
                  error: errorCode,
                  message: errorMessage,
                  timestamp: new Date().toISOString(),
                });
                return;
              }
            }

            if (document && typeof document.content === 'string') {
              // 저장된 문서가 있으면 파싱
              try {
                const parsedContent = JSON.parse(document.content);
                document = {
                  ...document,
                  ...parsedContent,
                };
              } catch (parseError) {
                console.error('[결과 조회] 문서 content 파싱 실패:', parseError);
                // 파싱 실패 시 원본 유지
              }
            }
          } catch (dbError: any) {
            console.error('[결과 조회] 문서 조회 중 DB 에러:', dbError);
            // DB 에러가 발생해도 document를 null로 유지하고 계속 진행
            document = null;
          }
        }

        const response: ApiResponse = {
          success: true,
          data: {
            sessionMeta: {
              sessionId: sessionRecord.id,
              category: sessionRecord.category,
              formType: payload.formType,
              mode: sessionRecord.mode,
              remainingTime: sessionRecord.remainingTime,
              isPaid: !!sessionRecord.remainingTime || sessionRecord.mode === 'DOCUMENT',
            },
            document,
            lastChats: chats.map((chat: any) => {
              // aiOutput 파싱 (안전하게 처리)
              let parsedAiOutput: any = null;
              if (chat.aiOutput) {
                if (typeof chat.aiOutput === 'string') {
                  try {
                    parsedAiOutput = JSON.parse(chat.aiOutput);
                  } catch (e) {
                    // JSON 파싱 실패 시 문자열 그대로 사용
                    parsedAiOutput = chat.aiOutput;
                  }
                } else {
                  parsedAiOutput = chat.aiOutput;
                }
              }

              return {
                id: chat.id,
                sessionId: chat.sessionId,
                userInput: chat.userInput || '',
                aiOutput: parsedAiOutput,
                elapsedTime: chat.elapsedTime || 0,
                isPaid: chat.isPaid || false,
                createdAt: chat.createdAt,
              };
            }),
            cta: { 
              label: '채팅으로 이어보기(홍시 사용)', 
              requiresPayment: sessionRecord.remainingTime <= 0 
            },
          },
          timestamp: new Date().toISOString(),
        };

        res.status(200).json(response);
      } catch (error: any) {
        console.error('[결과 조회] 토큰 검증 실패:', {
          token: token.substring(0, 20) + '...',
          tokenLength: token.length,
          error: error?.message || error,
          errorName: error?.name,
          stack: error?.stack?.split('\n')[0],
        });
        res.status(401).json({ success: false, error: 'TOKEN_INVALID', message: error?.message || '토큰이 유효하지 않거나 만료되었습니다.' });
      }
    },
  );

  /**
   * 결제 내역 조회
   * GET /api/v1/fortune/payments
   */
  getPayments = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as any;
      const category = req.query.category as any;
      const mode = req.query.mode as any;

      const result = await this.getPaymentsUseCase.execute({
        userId: user.sub,
        page,
        limit: Math.min(limit, 100), // 최대 100개로 제한
        status,
        category,
        mode,
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        message: '결제 내역을 조회했습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * 결제 내역 상세 조회
   * GET /api/v1/fortune/payments/:orderId
   */
  getPaymentDetail = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { orderId } = req.params;

      if (!orderId) {
        throw new Error('주문 ID가 필요합니다.');
      }

      const result = await this.getPaymentDetailUseCase.execute(
        user.sub,
        orderId,
      );

      if (!result) {
        res.status(404).json({
          success: false,
          error: 'ORDER_NOT_FOUND',
          message: '결제 내역을 찾을 수 없습니다.',
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: result,
        message: '결제 내역 상세 정보를 조회했습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );

  /**
   * 문서 재생성
   * POST /api/v1/fortune/document/regenerate
   */
  regenerateDocument = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { sessionId } = req.body;

      if (!sessionId) {
        throw new Error('세션 ID가 필요합니다.');
      }

      const result = await this.regenerateDocumentUseCase.execute(
        user.sub,
        sessionId,
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: '문서가 재생성되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    },
  );
}