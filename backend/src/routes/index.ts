import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import env from '../config/env';

// Repository implementations
import { PrismaIPLimitRepository } from '../repositories/impl/PrismaIPLimitRepository';
import { PrismaFortuneSessionRepository } from '../repositories/impl/PrismaFortuneSessionRepository';
import { PrismaConversationLogRepository } from '../repositories/impl/PrismaConversationLogRepository';
import { PrismaDocumentResultRepository } from '../repositories/impl/PrismaDocumentResultRepository';
import { PrismaHongsiCreditRepository } from '../repositories/impl/PrismaHongsiCreditRepository';

// Services
import { IPLimitService } from '../services/IPLimitService';
import { FortuneGPTService } from '../services/FortuneGPTService';

// Use cases
import { BoardPostUseCase } from '../usecases/BoardPostUseCase';
import { PrismaBoardPostRepository } from '../repositories/impl/PrismaBoardPostRepository';
import { CreateFortuneSessionUseCase } from '../usecases/CreateFortuneSessionUseCase';
import { ChatFortuneUseCase } from '../usecases/ChatFortuneUseCase';
import { DocumentFortuneUseCase } from '../usecases/DocumentFortuneUseCase';
import { GetSessionUseCase } from '../usecases/GetSessionUseCase';
import { GetDocumentUseCase } from '../usecases/GetDocumentUseCase';
import { PurchaseHongsiUseCase } from '../usecases/PurchaseHongsiUseCase';
import { ExtendSessionTimeUseCase } from '../usecases/ExtendSessionTimeUseCase';
import { CreatePaymentDetailUseCase } from '../usecases/CreatePaymentDetailUseCase';
import { GetFortuneStatisticsUseCase } from '../usecases/GetFortuneStatisticsUseCase';
import { PrepareFortunePaymentUseCase } from '../usecases/PrepareFortunePaymentUseCase';
import { FortuneProductService } from '../services/FortuneProductService';
import { PaymentService } from '../services/PaymentService';

// Controllers
import { AuthController } from '../controllers/AuthController';
import { BoardController } from '../controllers/BoardController';
import { FortuneController } from '../controllers/FortuneController';

// Routes
import { createAuthRoutes } from './authRoutes';
import { createBoardRoutes } from './boardRoutes';
import { createFortuneRoutes } from './fortuneRoutes';
import adminRoutes from './adminRoutes';

// Middleware
import { resetIPLimits } from '../middlewares/ipLimitMiddleware';

// Dependency Injection Container
class DIContainer {
  private static instance: DIContainer;
  private prisma!: PrismaClient;
  
  // Repositories
  private ipLimitRepository!: PrismaIPLimitRepository;
  private recommendationParamsRepository!: any; // PrismaRecommendationParamsRepository
  
  // Services
  private ipLimitService!: IPLimitService;
  
  // Use Cases
  private boardPostUseCase!: any; // BoardPostUseCase
  
  // Controllers
  private authController!: AuthController;
  private boardController!: BoardController;
  private fortuneController!: FortuneController;

  // Fortune Services
  private fortuneGPTService!: FortuneGPTService;

  private constructor() {
    this.initializeDependencies();
  }

  public static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  private initializeDependencies(): void {
    // Database
    this.prisma = new PrismaClient();

    // Repositories
    this.ipLimitRepository = new PrismaIPLimitRepository(this.prisma);

    // Services
    this.ipLimitService = IPLimitService.getInstance(this.ipLimitRepository);

    // Use Cases
    // Board Use Case
    this.boardPostUseCase = new BoardPostUseCase(new PrismaBoardPostRepository(this.prisma));

    // Fortune GPT Service
    this.fortuneGPTService = new FortuneGPTService(env.OPENAI_API_KEY);

    // Fortune Services (먼저 생성)
    const fortuneProductService = new FortuneProductService();
    const paymentService = new PaymentService();

    // Fortune Repositories
    const fortuneSessionRepository = new PrismaFortuneSessionRepository(this.prisma);
    const conversationLogRepository = new PrismaConversationLogRepository(this.prisma);
    const documentRepository = new PrismaDocumentResultRepository(this.prisma);
    const hongsiCreditRepository = new PrismaHongsiCreditRepository(this.prisma);

    // Fortune Use Cases
    const createSessionUseCase = new CreateFortuneSessionUseCase(
      fortuneSessionRepository,
      hongsiCreditRepository,
      this.prisma,
      fortuneProductService,
    );
    const chatUseCase = new ChatFortuneUseCase(
      fortuneSessionRepository,
      conversationLogRepository,
      this.fortuneGPTService,
    );
    const documentUseCase = new DocumentFortuneUseCase(
      documentRepository,
      this.fortuneGPTService,
    );
    const getSessionUseCase = new GetSessionUseCase(fortuneSessionRepository);
    const getDocumentUseCase = new GetDocumentUseCase(documentRepository);
    const purchaseHongsiUseCase = new PurchaseHongsiUseCase(
      hongsiCreditRepository,
      fortuneSessionRepository,
    );
    const extendSessionTimeUseCase = new ExtendSessionTimeUseCase(fortuneSessionRepository);
    const getStatisticsUseCase = new GetFortuneStatisticsUseCase(this.prisma);
    
    // Fortune Payment UseCase
    const preparePaymentUseCase = new PrepareFortunePaymentUseCase(
      this.prisma,
      fortuneProductService,
      paymentService,
    );

    // Controllers
    this.authController = new AuthController();
    this.boardController = new BoardController(this.boardPostUseCase);
    this.fortuneController = new FortuneController(
      createSessionUseCase,
      chatUseCase,
      documentUseCase,
      getSessionUseCase,
      getDocumentUseCase,
      purchaseHongsiUseCase,
      extendSessionTimeUseCase,
      getStatisticsUseCase,
      preparePaymentUseCase,
      fortuneProductService,
    );
  }

  public getAuthController(): AuthController {
    return this.authController;
  }

  public getBoardController(): BoardController {
    return this.boardController;
  }

  public getFortuneController(): FortuneController {
    return this.fortuneController;
  }

  public getIPLimitService(): IPLimitService {
    return this.ipLimitService;
  }

  public async closeDatabase(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// API 라우트 생성
export const createApiRoutes = (): Router => {
  const router = Router();
  const container = DIContainer.getInstance();

  // 개발용 IP 제한 초기화 라우트 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    router.use('/dev/reset-ip-limits', resetIPLimits(container.getIPLimitService()));
  }

  // 각 라우트 그룹 등록 (운세 서비스 전환을 위한 최소 라우트만 유지)
  router.use('/auth', createAuthRoutes(container.getAuthController()));
  router.use('/board', createBoardRoutes(container.getBoardController()));
  router.use('/admin', adminRoutes);
  
  // 운세 라우트
  router.use('/fortune', createFortuneRoutes(container.getFortuneController()));

  return router;
};

// 컨테이너 export (정리용)
export { DIContainer }; 