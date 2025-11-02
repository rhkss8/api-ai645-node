/**
 * 포포춘 운세 컨트롤러
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ApiResponse } from '../types/common';
import { FortuneApiResponse, FortuneCategory, SessionMode } from '../types/fortune';
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
    private readonly productService: FortuneProductService,
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

      const { category, mode, userInput, paymentId, useFreeHongsi, durationMinutes } = req.body;

      if (!category || !mode || !userInput) {
        throw new Error('카테고리, 모드, 사용자 입력은 필수입니다.');
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
        mode: mode as SessionMode,
        userInput,
        paymentId,
        useFreeHongsi,
        durationMinutes,
      });

      const response: FortuneApiResponse = {
        success: true,
        data: {
          sessionId: session.id,
          category: session.category,
          mode: session.mode,
          remainingTime: session.remainingTime,
          isActive: session.isActive,
          expiresAt: session.expiresAt.toISOString(),
          isPaid: !!paymentId,
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

      const sessionData = await this.getSessionUseCase.execute(id, user.sub);

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

      const documentData = await this.getDocumentUseCase.execute(id, user.sub);

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
        id,
        user.sub,
        additionalSeconds,
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
}