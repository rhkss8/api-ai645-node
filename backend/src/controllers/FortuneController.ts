/**
 * 포포춘 운세 컨트롤러
 */
import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/errorHandler';
import { ApiResponse } from '../types/common';
import { FortuneApiResponse, FortuneCategory, SessionMode, FormType, isChatResponseV2 } from '../types/fortune';
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
import { GetChatSessionsUseCase } from '../usecases/GetChatSessionsUseCase';
import { RegenerateDocumentUseCase } from '../usecases/RegenerateDocumentUseCase';
import { StartChatFromDocumentUseCase } from '../usecases/StartChatFromDocumentUseCase';
import { FortuneProductService } from '../services/FortuneProductService';
import { ResultTokenService } from '../services/ResultTokenService';
import { PaymentService } from '../services/PaymentService';
import { FortuneGPTService } from '../services/FortuneGPTService';
import { INITIAL_CHAT_GUIDES, CATEGORY_NAMES } from '../data/fortuneProducts';
import { HongsiUnit, FortuneProductType } from '../types/fortune';
import { CustomError } from '../middlewares/errorHandler';
import { IdGenerator } from '../utils/idGenerator';

function generateNextQuestionsByText(params: {
  category: FortuneCategory;
  text?: string;
}): string[] {
  const { category, text } = params;
  const s = (text || '').toLowerCase();

  // 이미지 업로드 기반 카테고리 (ASK에서도 사용)
  if (category === FortuneCategory.HAND) {
    return [
      '손바닥 사진(오른손/왼손) 업로드했어요. 이제 봐주세요.',
      '왼손이랑 오른손 중 어떤 손이 더 중요해요?',
      '손금에서 어떤 부분(재물/연애/직장)을 먼저 봐주실래요?',
      '손바닥을 어떻게 찍어야 잘 나오나요?',
      '사진이 흐릿하면 다시 찍어야 하나요?',
    ];
  }

  if (category === FortuneCategory.FACE) {
    return [
      '정면 얼굴 사진 업로드했어요. 이제 봐주세요.',
      '관상에서 가장 먼저 봐야 하는 부분은 어디인가요?',
      '제 인상에서 일/재물 흐름은 어떻게 보이나요?',
      '연애나 인간관계 흐름도 같이 봐주세요.',
      '사진을 어떻게 찍어야 관상이 잘 보이나요?',
    ];
  }

  if (category === FortuneCategory.LUCKY_NUMBER) {
    return [
      '이미지 업로드했어요. 로또 번호 추천해 주세요.',
      '이번 주 로또에 맞춰 1~2세트 추천해 줄 수 있나요?',
      '숫자 조합을 추천한 이유도 같이 설명해 주세요.',
      '피해야 할 숫자 조합이 있나요?',
      '운이 강한 요일/시간대도 알려주세요.',
    ];
  }

  switch (category) {
    case FortuneCategory.BUSINESS: {
      const hasTiming = s.includes('시기') || s.includes('타이밍') || s.includes('언제');
      const hasMoney = s.includes('재물') || s.includes('수익') || s.includes('매출') || s.includes('투자') || s.includes('금전');
      const hasPartner = s.includes('파트너') || s.includes('동업') || s.includes('협업') || s.includes('사람') || s.includes('인맥');

      const base = [
        '지금 사업에서 가장 큰 리스크(자금/인력/시장)는 무엇인가요?',
        '앞으로 3개월 내에 꼭 잡아야 할 기회는 무엇일까요?',
        '확장/독립/전환 중 어떤 선택이 더 유리한가요?',
        '의사결정을 내릴 “좋은 시기”는 언제로 보이나요?',
        '사업운을 살리기 위한 현실적인 액션 3가지를 알려주세요.',
      ];
      // summary 힌트가 있으면 우선순위만 살짝 조정
      if (hasMoney) {
        return [
          '지금 돈이 새는 구간(지출/투자/운영)부터 잡아야 할까요?',
          ...base.filter(q => !q.includes('돈이 새는')),
        ].slice(0, 5);
      }
      if (hasPartner) {
        return [
          '동업/파트너십을 해도 괜찮을까요? 주의할 점은?',
          ...base,
        ].slice(0, 5);
      }
      if (hasTiming) {
        return [
          '결정/런칭/확장의 타이밍을 구체적으로 잡아주세요.',
          ...base,
        ].slice(0, 5);
      }
      return base;
    }

    case FortuneCategory.INVESTMENT:
      return [
        '지금은 공격/방어 중 어떤 투자 성향이 유리할까요?',
        '단기 vs 장기 중 어떤 전략이 맞나요?',
        '이번 달에 피해야 할 투자 실수는 무엇인가요?',
        '수익을 키우는 핵심 포인트(정보/타이밍/분산)는 뭐예요?',
        '투자금 비중(현금/주식/코인 등)을 어떻게 가져가면 좋을까요?',
      ];

    case FortuneCategory.LOVE:
      return [
        '상대의 마음은 지금 어떤 상태로 보이나요?',
        '관계가 좋아지려면 제가 먼저 바꿔야 할 포인트는?',
        '연락/만남을 시도하기 좋은 타이밍이 있을까요?',
        '이 관계를 오래 끌어도 괜찮을까요? 결론이 보이나요?',
        '연애운을 올리는 현실적인 행동 3가지를 알려주세요.',
      ];

    case FortuneCategory.BREAK_UP:
      return [
        '재회 가능성이 지금 얼마나 되나요?',
        '연락을 먼저 해야 할까요, 기다려야 할까요?',
        '재회에 유리한 시기/계기가 있을까요?',
        '상대가 돌아오게 만드는 대화 방식이 있나요?',
        '재회가 아니라면 새 인연 운은 언제쯤일까요?',
      ];

    case FortuneCategory.CAREER:
      return [
        '이직 vs 현 직장 유지 중 어떤 선택이 유리할까요?',
        '승진/평가운이 강한 시기가 언제인가요?',
        '현재 스트레스/관계 문제를 푸는 방법이 있을까요?',
        '내 강점이 잘 발휘되는 직무/환경은 어떤 쪽인가요?',
        '커리어 운을 올리는 액션(자격/프로젝트/인맥) 3가지를 알려주세요.',
      ];

    case FortuneCategory.MOVING:
      return [
        '이사하기 좋은 시기(월/주)는 언제인가요?',
        '현재 집을 유지하는 게 나을까요, 옮기는 게 나을까요?',
        '방향/지역 선택에서 유리한 포인트가 있나요?',
        '이사 후 금전/직장/건강 운 흐름이 어떻게 바뀌나요?',
        '계약/이사 준비 시 주의할 점이 있을까요?',
      ];

    case FortuneCategory.TRAVEL:
      return [
        '여행을 가기 좋은 시기와 피해야 할 시기가 있나요?',
        '여행 방향(동/서/남/북) 중 유리한 쪽이 있나요?',
        '여행에서 얻을 수 있는 기회(인연/일/휴식)는 무엇일까요?',
        '이번 여행에서 조심해야 할 리스크가 있나요?',
        '혼자 vs 동행 중 어떤 형태가 더 좋나요?',
      ];

    case FortuneCategory.COMPATIBILITY:
      return [
        '두 사람의 잘 맞는 점과 충돌 포인트는 무엇인가요?',
        '궁합이 좋아지려면 어떤 대화/규칙이 필요할까요?',
        '장기적으로 결혼/동거로 이어질 가능성은?',
        '갈등이 생길 때 가장 피해야 할 행동은?',
        '관계가 좋아지는 시기가 따로 있나요?',
      ];

    case FortuneCategory.TAROT:
      return [
        '제가 지금 가장 중요하게 봐야 할 메시지는 무엇인가요?',
        '선택지 A/B 중 어떤 쪽이 더 유리한가요?',
        '이 일이 진행되면 1~3개월 뒤 흐름은 어떻게 되나요?',
        '제가 놓치고 있는 변수(사람/돈/타이밍)가 있나요?',
        '불안 요소를 줄이기 위한 행동을 알려주세요.',
      ];

    case FortuneCategory.DREAM:
      return [
        '꿈에서 가장 강하게 남은 장면/상징은 무엇이었나요?',
        '그 꿈을 꾸면서 느낀 감정(불안/기쁨 등)은 어땠나요?',
        '최근에 현실에서 스트레스/고민이 있었나요?',
        '꿈이 경고인지, 기회 신호인지 구분해 주세요.',
        '이 꿈 이후에 조심하면 좋은 행동/선택이 있을까요?',
      ];

    case FortuneCategory.CAR_PURCHASE:
      return [
        '지금 차를 사는 게 유리한 시기인가요?',
        '신차 vs 중고차 중 어떤 선택이 더 맞나요?',
        '예산/할부/보험에서 조심할 점이 있나요?',
        '차를 바꾸면 생활/일 운이 어떻게 바뀌나요?',
        '구매 전 체크해야 할 “결정 포인트” 3가지를 알려주세요.',
      ];

    case FortuneCategory.LUCKY_DAY:
      return [
        '제가 원하는 일(계약/오픈/고백 등)에 가장 좋은 날짜를 추천해 주세요.',
        '피해야 할 날/시간대도 같이 알려주세요.',
        '좋은 날을 고르는 기준이 무엇인가요?',
        '제게 특히 운이 붙는 요일/시간이 있나요?',
        '그 날에 하면 좋은 행동/의식이 있을까요?',
      ];

    case FortuneCategory.NAMING:
      return [
        '원하는 이름 느낌(부드러움/강인함/지적 등)이 있나요?',
        '피해야 할 발음/한자가 있나요?',
        '이름이 운세(직장/재물/인간관계)에 미치는 포인트는?',
        '후보 이름 2~3개가 있는데 비교해 줄 수 있나요?',
        '이름 외에 함께 보면 좋은 요소(개명 시기 등)가 있나요?',
      ];

    default:
      return [
        '제가 지금 가장 집중해야 할 운세 포인트는 무엇인가요?',
        '좋은 흐름을 더 키우려면 어떤 행동이 필요할까요?',
        '조심해야 할 리스크/실수는 무엇인가요?',
        '시기적으로 유리한 타이밍이 언제인가요?',
        '한 문장으로 핵심 조언을 정리해 주세요.',
      ];
  }
}

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
    private readonly getChatSessionsUseCase: GetChatSessionsUseCase,
    private readonly regenerateDocumentUseCase: RegenerateDocumentUseCase,
    private readonly startChatFromDocumentUseCase: StartChatFromDocumentUseCase,
    private readonly paymentService: PaymentService,
    private readonly productService: FortuneProductService,
    private readonly resultTokenService: ResultTokenService,
    private readonly gptService: FortuneGPTService,
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
   * - useFreeHongsi?: boolean (선택, 채팅형만, 무료 홍시 5분, 하루 1회, paymentId와 동시 사용 불가)
   */
  createSession = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { category, formType, mode, userInput, userData, paymentId, portOnePaymentId, useFreeHongsi } = req.body;

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
          ...(session.chatEntitlementExpiresAt
            ? {
                chatEntitlementExpiresAt:
                  session.chatEntitlementExpiresAt.toISOString(),
              }
            : {}),
          isPaid: !!paymentId,
          resultToken,
        },
        remainingTime: session.remainingTime,
        isFreeHongsi: !!useFreeHongsi,
        message: '세션이 생성되었습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    },
  );

  startChatFromDocument = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const { documentId, forceNewSession } = req.body;
      if (!documentId) {
        throw new Error('documentId는 필수입니다.');
      }

      const result = await this.startChatFromDocumentUseCase.execute({
        userId: user.sub,
        documentId,
        forceNewSession: !!forceNewSession,
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        message: result.reusedSession
          ? '기존 채팅 세션에 문서 컨텍스트를 연결했습니다.'
          : '문서 기반 새 채팅 세션을 생성했습니다.',
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
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

        const {
          productType,
          category,
          chatEntitlementDays,
          payMethod,
          easyPayProvider,
        } = req.body;

        if (!productType) {
          console.error('[결제 준비] 필수 파라미터 누락:', { productType, category });
          throw new Error('상품 타입은 필수입니다.');
        }

        if (productType === FortuneProductType.CHAT_SESSION) {
          if (chatEntitlementDays == null || ![1, 7, 30].includes(Number(chatEntitlementDays))) {
            throw new Error('채팅형은 chatEntitlementDays(1, 7, 30)가 필요합니다.');
          }
        } else if (!category) {
          throw new Error('문서형은 카테고리가 필요합니다.');
        }


        console.log('[결제 준비] UseCase 실행 시작:', {
          userId: user.sub,
          productType,
          category,
          chatEntitlementDays,
          payMethod,
          easyPayProvider,
        });

        const result = await this.preparePaymentUseCase.execute(
          user.sub,
          productType as FortuneProductType,
          category as FortuneCategory,
          payMethod,
          easyPayProvider,
          productType === FortuneProductType.CHAT_SESSION
            ? (Number(chatEntitlementDays) as 1 | 7 | 30)
            : undefined,
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
        throw new CustomError('로그인이 필요합니다.', 401, 'AUTH_REQUIRED');
      }

      const { sessionId, message } = req.body;
      const upload = (req as Request & { file?: Express.Multer.File }).file;

      if (!sessionId || (!message && !upload)) {
        throw new CustomError('세션 ID와 메시지 또는 이미지는 필수입니다.', 400, 'INVALID_REQUEST', {
          required: ['sessionId', 'message|image'],
        });
      }

      const image = upload
        ? {
            mimeType: upload.mimetype,
            base64Data: upload.buffer.toString('base64'),
            filename: upload.originalname,
          }
        : undefined;

      const result = await this.chatUseCase.execute(sessionId, message || '', user.sub, image);

      const response: FortuneApiResponse = {
        success: true,
        data: result.response,
        remainingTime: result.effectiveRemainingSeconds,
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
   * 결제 상태 확인 + PortOne 검증 동기화 (채팅 이용권 독립 구매용)
   * POST /api/v1/fortune/payment/:paymentId/confirm
   */
  confirmPayment = asyncHandler(
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
      const { portOnePaymentId } = req.body ?? {};

      if (!paymentId) {
        res.status(400).json({ success: false, error: 'PAYMENT_ID_REQUIRED' });
        return;
      }

      const payment = await this.paymentService.getPaymentById(paymentId);
      if (!payment) {
        res.status(404).json({ success: false, error: 'PAYMENT_NOT_FOUND' });
        return;
      }

      if (payment.order.userId !== user.sub) {
        res.status(403).json({ success: false, error: 'PAYMENT_ACCESS_DENIED' });
        return;
      }

      if (payment.status === 'PENDING') {
        await this.paymentService.verifyAndUpdatePaymentStatus(paymentId, portOnePaymentId);
      }

      const latest = await this.paymentService.getPaymentById(paymentId);
      if (!latest) {
        res.status(404).json({ success: false, error: 'PAYMENT_NOT_FOUND' });
        return;
      }

      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
      });

      res.status(200).json({
        success: true,
        data: {
          paymentId: latest.id,
          status: latest.status,
          amount: latest.amount,
          paidAt: latest.paidAt,
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
        const tStart = Date.now();
        console.log('[결과 조회] 토큰 검증 시작:', { token: token.substring(0, 20) + '...', tokenLength: token.length });
        const payload = this.resultTokenService.verify(token);
        console.log('[결과 조회] 토큰 검증 성공:', { sessionId: payload.sessionId, userId: payload.userId, ms: Date.now() - tStart });

        const tDbStart = Date.now();
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

        // 최근 채팅 N개 조회 (초기 가이드 행 제외: userInput !== '' 만)
        const chats = await prisma.conversationLog.findMany({
          where: {
            sessionId: payload.sessionId,
            userInput: { not: '' },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
        console.log('[결과 조회] DB 조회 완료:', { ms: Date.now() - tDbStart, sessionId: payload.sessionId, chatsCount: chats.length });

        const sessionUserData = sessionRecord.userData as Record<string, any> | undefined;
        const sessionDocumentBridge = sessionUserData?.documentBridge as
          | {
              sourceDocumentId?: string;
              title?: string;
              anchorSummary?: string | null;
              topicCards?: Array<{
                topic?: string;
                summary?: string;
                recommendedQuestions?: string[];
              }>;
              followupMap?: Array<{
                topic?: string;
                keywords?: string[];
              }>;
              riskNotes?: string[];
            }
          | undefined;

        // ASK+CHAT: 초기 가이드는 DB에서 먼저 조회, 없으면 생성 후 저장
        let initialChatGuide: any = null;
        if (payload.formType === 'ASK' && sessionRecord.mode === 'CHAT') {
          const existingInitial = await prisma.conversationLog.findFirst({
            where: { sessionId: payload.sessionId, userInput: '' },
          });
          if (existingInitial) {
            let parsed: any = null;
            try {
              parsed = typeof existingInitial.aiOutput === 'string'
                ? JSON.parse(existingInitial.aiOutput)
                : existingInitial.aiOutput;
            } catch {
              parsed = { message: String(existingInitial.aiOutput) };
            }
            initialChatGuide = {
              id: 'initial_guide',
              sessionId: payload.sessionId,
              userInput: '',
              aiOutput: parsed,
              elapsedTime: existingInitial.elapsedTime ?? 0,
              isPaid: existingInitial.isPaid ?? false,
              createdAt: existingInitial.createdAt,
            };
          } else if (chats.length === 0) {
            const guide = INITIAL_CHAT_GUIDES[sessionRecord.category as FortuneCategory];
            if (guide) {
              try {
                if (guide.type === 'AI_GENERATED') {
                // 사주 정보 기반으로 AI가 초기 메시지 생성 (외부 API 호출 → 대부분 지연 원인)
                const userData = sessionRecord.userData as Record<string, any> | undefined;
                const categoryName = CATEGORY_NAMES[sessionRecord.category as FortuneCategory];
                
                const tAiStart = Date.now();
                // 초기 인사말 생성 (userInput은 빈 문자열, userData 기반으로 생성)
                const aiResponse = await this.gptService.generateChatResponse(
                  sessionRecord.category as FortuneCategory,
                  guide.prompt || `${categoryName} 상담을 시작하겠습니다. 어떤 도움이 필요하신가요?`,
                  undefined,
                  userData,
                );
                console.log('[결과 조회] 초기 가이드 AI 생성 완료:', { ms: Date.now() - tAiStart, category: sessionRecord.category });

                const ensured = (() => {
                  // AI가 nextQuestions를 내려주는 것이 정상 흐름
                  if (aiResponse && typeof aiResponse === 'object') {
                    const existing = (aiResponse as any).nextQuestions;
                    if (Array.isArray(existing) && existing.length > 0) {
                      return aiResponse;
                    }
                    const baseText = isChatResponseV2(aiResponse as any)
                      ? (aiResponse as any).message
                      : (aiResponse as any).summary;
                    return {
                      ...(aiResponse as any),
                      nextQuestions: generateNextQuestionsByText({
                        category: sessionRecord.category as FortuneCategory,
                        text: baseText,
                      }),
                    };
                  }
                  return aiResponse;
                })();

                initialChatGuide = {
                  id: 'initial_guide',
                  sessionId: payload.sessionId,
                  userInput: '',
                  aiOutput: ensured,
                  elapsedTime: 0,
                  isPaid: false,
                  createdAt: sessionRecord.createdAt,
                };
                await prisma.conversationLog.create({
                  data: {
                    id: IdGenerator.generateConversationLogId(),
                    sessionId: payload.sessionId,
                    userInput: '',
                    aiOutput: JSON.stringify(ensured),
                    elapsedTime: 0,
                    isPaid: false,
                  },
                });
              } else if (guide.type === 'STATIC' && guide.content) {
                // 단순 안내 문구
                const nextQuestions = generateNextQuestionsByText({
                  category: sessionRecord.category as FortuneCategory,
                  text: guide.content,
                });
                const staticOutput = {
                  message: guide.content,
                  nextQuestions,
                };
                initialChatGuide = {
                  id: 'initial_guide',
                  sessionId: payload.sessionId,
                  userInput: '',
                  aiOutput: staticOutput,
                  elapsedTime: 0,
                  isPaid: false,
                  createdAt: sessionRecord.createdAt,
                };
                await prisma.conversationLog.create({
                  data: {
                    id: IdGenerator.generateConversationLogId(),
                    sessionId: payload.sessionId,
                    userInput: '',
                    aiOutput: JSON.stringify(staticOutput),
                    elapsedTime: 0,
                    isPaid: false,
                  },
                });
              }
              } catch (error) {
              console.error('[결과 조회] 초기 채팅 가이드 생성 실패:', error);
              // 초기 가이드는 채팅 유도에 필수이므로, 최종 실패 시 에러 응답 반환
              const status = Number((error as any)?.status || (error as any)?.cause?.status);
              if (status === 429) {
                res.status(429).json({
                  success: false,
                  error: 'AI_QUOTA_EXCEEDED',
                  message: 'AI 서비스 할당량이 초과되었습니다. 잠시 후 다시 시도해주세요.',
                  timestamp: new Date().toISOString(),
                });
                return;
              }

              if (status === 503) {
                res.status(503).json({
                  success: false,
                  error: 'AI_SERVICE_UNAVAILABLE',
                  message: 'AI 모델이 혼잡합니다. 잠시 후 다시 시도해주세요.',
                  timestamp: new Date().toISOString(),
                });
                return;
              }

              res.status(500).json({
                success: false,
                error: 'AI_GENERATION_FAILED',
                message: '운세 응답 생성에 실패했습니다. 잠시 후 다시 시도해주세요.',
                timestamp: new Date().toISOString(),
              });
              return;
            }
            }
          }
        }

        const documentPendingWindowMs = 45 * 1000;
        const isRecentDocumentSession =
          sessionRecord.mode === 'DOCUMENT' &&
          Date.now() - sessionRecord.createdAt.getTime() < documentPendingWindowMs;

        // 문서형 세션인 경우: 문서 결과 조회 또는 생성
        let document: any = null;
        let documentPending = false;
        let documentGenerationState:
          | 'PENDING'
          | 'COMPLETED'
          | 'FAILED'
          | 'UNAVAILABLE' = 'UNAVAILABLE';
        if (sessionRecord.mode === 'DOCUMENT') {
          try {
            // 1. PaymentDetail을 통해 documentId 찾기 (우선순위)
            const paymentDetail = await prisma.paymentDetail.findFirst({
              where: { sessionId: payload.sessionId },
              select: { documentId: true, result: true, paymentId: true },
            });

            const paymentDetailResult =
              paymentDetail?.result && typeof paymentDetail.result === 'object'
                ? (paymentDetail.result as {
                    generationStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
                    errorCode?: string;
                    errorMessage?: string;
                  })
                : null;

            if (paymentDetailResult?.generationStatus) {
              documentGenerationState = paymentDetailResult.generationStatus;
            }

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
            
            // 3. 최근 문서 세션은 백그라운드 생성 중일 수 있으므로, 추정 매칭보다 pending 상태를 우선한다.
            if (!document && !isRecentDocumentSession) {
              // PaymentDetail에 documentId가 없고 Order metadata에도 없으면 세션 생성 시점에 생성된 문서 찾기
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

            if (!document && sessionRecord.mode === 'CHAT' && sessionDocumentBridge?.sourceDocumentId) {
              document = await prisma.documentResult.findUnique({
                where: { id: sessionDocumentBridge.sourceDocumentId },
              });
            }

            if (!document && isRecentDocumentSession) {
              if (paymentDetailResult?.generationStatus === 'FAILED') {
                const statusCode =
                  paymentDetailResult.errorCode === 'AI_QUOTA_EXCEEDED' ||
                  paymentDetailResult.errorCode === 'insufficient_quota'
                    ? 429
                    : 500;

                res.status(statusCode).json({
                  success: false,
                  error:
                    paymentDetailResult.errorCode === 'insufficient_quota'
                      ? 'AI_QUOTA_EXCEEDED'
                      : paymentDetailResult.errorCode || 'AI_GENERATION_FAILED',
                  message:
                    paymentDetailResult.errorMessage ||
                    '운세 리포트 생성에 실패했습니다.',
                  timestamp: new Date().toISOString(),
                });
                return;
              }

              documentPending = true;
              documentGenerationState = 'PENDING';
              console.log('[결과 조회] 최근 문서 세션은 pending으로 유지:', {
                sessionId: payload.sessionId,
                sessionAgeMs: Date.now() - sessionRecord.createdAt.getTime(),
              });
            }

            // 4. 문서가 없으면 GPT로 생성 (오래된 세션의 legacy 복구 전용 fallback)
            if (!document && !isRecentDocumentSession && sessionRecord.userInput) {
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
                  documentGenerationState = 'COMPLETED';

                  // fallback 생성이더라도 이후에는 PaymentDetail.documentId를 우선 source of truth로 삼는다.
                  const paymentDetailForLink = await prisma.paymentDetail.findFirst({
                    where: { sessionId: payload.sessionId },
                    select: {
                      id: true,
                      documentId: true,
                      paymentId: true,
                    },
                  });

                  if (paymentDetailForLink && paymentDetailForLink.documentId !== documentId) {
                    await prisma.paymentDetail.update({
                      where: { id: paymentDetailForLink.id },
                      data: {
                        documentId,
                        result: {
                          generationStatus: 'COMPLETED',
                          updatedAt: new Date().toISOString(),
                        },
                      },
                    });
                  }

                  if (paymentDetailForLink?.paymentId) {
                    const payment = await prisma.payment.findUnique({
                      where: { id: paymentDetailForLink.paymentId },
                      select: { orderId: true },
                    });

                    if (payment?.orderId) {
                      const order = await prisma.order.findUnique({
                        where: { id: payment.orderId },
                        select: { metadata: true },
                      });

                      const orderMetadata = (order?.metadata as any) || {};
                      if (
                        orderMetadata.documentId !== documentId ||
                        orderMetadata.sessionId !== payload.sessionId
                      ) {
                        await prisma.order.update({
                          where: { id: payment.orderId },
                          data: {
                            metadata: {
                              ...orderMetadata,
                              documentId,
                              sessionId: payload.sessionId,
                            },
                          },
                        });
                      }
                    }
                  }
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
              ...(sessionDocumentBridge
                ? {
                    documentBridge: {
                      sourceDocumentId: sessionDocumentBridge.sourceDocumentId,
                      title: sessionDocumentBridge.title,
                      anchorSummary: sessionDocumentBridge.anchorSummary ?? null,
                      topicCards: Array.isArray(sessionDocumentBridge.topicCards)
                        ? sessionDocumentBridge.topicCards
                        : [],
                      followupMap: Array.isArray(sessionDocumentBridge.followupMap)
                        ? sessionDocumentBridge.followupMap
                        : [],
                      riskNotes: Array.isArray(sessionDocumentBridge.riskNotes)
                        ? sessionDocumentBridge.riskNotes
                        : [],
                    },
                  }
                : {}),
              remainingTime: (() => {
                const ent = sessionRecord.chatEntitlementExpiresAt as Date | null | undefined;
                if (ent) {
                  return Math.max(
                    0,
                    Math.floor((ent.getTime() - Date.now()) / 1000),
                  );
                }
                return sessionRecord.remainingTime;
              })(),
              chatEntitlementExpiresAt: sessionRecord.chatEntitlementExpiresAt
                ? (sessionRecord.chatEntitlementExpiresAt as Date).toISOString()
                : undefined,
              isPaid:
                !!sessionRecord.chatEntitlementExpiresAt ||
                !!sessionRecord.remainingTime ||
                sessionRecord.mode === 'DOCUMENT',
            },
            document,
            pending: documentPending,
            documentStatus: documentGenerationState,
            lastChats: (() => {
              // 기존 채팅 매핑
              const mappedChats = chats.map((chat: any) => {
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
                  aiOutput: (() => {
                    // aiOutput가 객체이고 summary/message가 있는 경우: nextQuestions를 추가로 붙임(저장된 데이터는 변경하지 않음)
                    if (parsedAiOutput && typeof parsedAiOutput === 'object') {
                      const existing = (parsedAiOutput as any).nextQuestions;
                      if (Array.isArray(existing) && existing.length > 0) {
                        return parsedAiOutput;
                      }

                      const baseText =
                        typeof (parsedAiOutput as any).message === 'string'
                          ? (parsedAiOutput as any).message
                          : typeof (parsedAiOutput as any).summary === 'string'
                            ? (parsedAiOutput as any).summary
                            : undefined;

                      if (!baseText) return parsedAiOutput;

                      return {
                        ...(parsedAiOutput as any),
                        nextQuestions: generateNextQuestionsByText({
                          category: sessionRecord.category as FortuneCategory,
                          text: baseText,
                        }),
                      };
                    }
                    return parsedAiOutput;
                  })(),
                  elapsedTime: chat.elapsedTime || 0,
                  isPaid: chat.isPaid || false,
                  createdAt: chat.createdAt,
                };
              });

              // 초기 가이드가 있으면 맨 앞에 추가 (nextQuestions는 카테고리/메시지 기반으로 항상 재생성)
              if (initialChatGuide) {
                const guideOutput = initialChatGuide.aiOutput;
                const baseText =
                  guideOutput && typeof (guideOutput as any).message === 'string'
                    ? (guideOutput as any).message
                    : guideOutput && typeof (guideOutput as any).summary === 'string'
                      ? (guideOutput as any).summary
                      : undefined;
                const normalizedGuide = {
                  ...initialChatGuide,
                  aiOutput: baseText
                    ? {
                        ...(typeof guideOutput === 'object' && guideOutput !== null ? guideOutput : {}),
                        nextQuestions: generateNextQuestionsByText({
                          category: sessionRecord.category as FortuneCategory,
                          text: baseText,
                        }),
                      }
                    : initialChatGuide.aiOutput,
                };
                return [normalizedGuide, ...mappedChats];
              }

              return mappedChats;
            })(),
            cta: {
              label: '채팅으로 이어보기(홍시 사용)',
              requiresPayment: (() => {
                if (sessionRecord.mode !== 'CHAT') {
                  return sessionRecord.remainingTime <= 0;
                }
                const ent = sessionRecord.chatEntitlementExpiresAt as Date | null | undefined;
                if (ent) {
                  return ent.getTime() <= Date.now();
                }
                return sessionRecord.remainingTime <= 0;
              })(),
            },
          },
          timestamp: new Date().toISOString(),
        };

        console.log('[결과 조회] 전체 완료:', { totalMs: Date.now() - tStart, sessionId: payload.sessionId, hasInitialGuide: !!initialChatGuide });
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
   * 채팅 세션 내역 조회
   * GET /api/v1/fortune/chat-sessions
   */
  getChatSessions = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = (req as any).user;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.getChatSessionsUseCase.execute({
        userId: user.sub,
        page,
        limit: Math.min(limit, 100),
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        message: '채팅 세션 내역을 조회했습니다.',
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
