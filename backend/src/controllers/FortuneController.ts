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

      // 결과 토큰 발급 (30분 만료)
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
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { productType, category, durationMinutes } = req.body;

      if (!productType || !category) {
        throw new Error('상품 타입과 카테고리는 필수입니다.');
      }

      // 채팅형일 경우 durationMinutes 필수
      if (productType === FortuneProductType.CHAT_SESSION && !durationMinutes) {
        throw new Error('채팅형은 시간 선택이 필수입니다. (5, 10, 30분)');
      }

      const result = await this.preparePaymentUseCase.execute(
        user.sub,
        productType as FortuneProductType,
        category as FortuneCategory,
        durationMinutes,
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: '결제 준비가 완료되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
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

      const document = await this.documentUseCase.execute(
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
      const { orderId, paymentId, amount, status } = req.body || {};
      if (!orderId || !paymentId || typeof amount !== 'number' || !status) {
        console.error('❌ 웹훅 페이로드 검증 실패:', { orderId, paymentId, amount, status });
        res.status(400).json({ success: false, error: 'INVALID_WEBHOOK_PAYLOAD' });
        return;
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

      // 결제 확정 처리
      console.log('✅ 웹훅 검증 통과, 결제 확정 처리 시작:', { orderId, paymentId, amount, status });
      const ok = await this.paymentService.confirmPaymentByWebhook({ orderId, paymentId, amount, status });
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
          // 기존 문서 조회 (세션 ID로 연결된 문서 찾기)
          document = await prisma.documentResult.findFirst({
            where: { 
              userId: payload.userId, 
              category: payload.category,
            },
            orderBy: { createdAt: 'desc' },
          });

          // 문서가 없으면 GPT로 생성
          if (!document && sessionRecord.userInput) {
            console.log('[결과 조회] 문서가 없어 GPT로 생성 시작:', { sessionId: payload.sessionId });
            try {
              const documentResponse = await this.documentUseCase.execute(
                payload.userId,
                payload.category,
                sessionRecord.userInput,
                sessionRecord.userData as Record<string, any> | undefined,
              );

              // 생성된 문서를 DocumentResult로 변환하여 응답에 포함
              document = {
                id: `doc_${payload.sessionId}`,
                userId: payload.userId,
                category: payload.category,
                title: documentResponse.title,
                date: documentResponse.date,
                summary: documentResponse.summary,
                content: documentResponse.content,
                advice: documentResponse.advice,
                warnings: documentResponse.warnings,
                chatPrompt: documentResponse.chatPrompt,
                issuedAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일
              };
            } catch (error: any) {
              console.error('[결과 조회] GPT 문서 생성 실패:', error);
              // GPT 생성 실패해도 에러를 반환하지 않고 document를 null로 유지
            }
          } else if (document && typeof document.content === 'string') {
            // 저장된 문서가 있으면 파싱
            try {
              const parsedContent = JSON.parse(document.content);
              document = {
                ...document,
                ...parsedContent,
              };
            } catch {
              // 파싱 실패 시 원본 유지
            }
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
            lastChats: chats.map((chat: any) => ({
              id: chat.id,
              sessionId: chat.sessionId,
              userInput: chat.userInput,
              aiOutput: typeof chat.aiOutput === 'string' ? JSON.parse(chat.aiOutput) : chat.aiOutput,
              elapsedTime: chat.elapsedTime,
              isPaid: chat.isPaid,
              createdAt: chat.createdAt,
            })),
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
}