import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import env from '../config/env';

// Repository implementations
import { PrismaRecommendationHistoryRepository } from '../repositories/impl/PrismaRecommendationHistoryRepository';
import { PrismaRecommendationReviewRepository } from '../repositories/impl/PrismaRecommendationReviewRepository';
import { PrismaWinningNumbersRepository } from '../repositories/impl/PrismaWinningNumbersRepository';
import { PrismaIPLimitRepository } from '../repositories/impl/PrismaIPLimitRepository';
import { OpenAIGPTService } from '../repositories/impl/OpenAIGPTService';

// Services
import { IPLimitService } from '../services/IPLimitService';

// Use cases
import { GenerateRecommendationUseCase } from '../usecases/GenerateRecommendationUseCase';
import { GenerateReviewUseCase } from '../usecases/GenerateReviewUseCase';
import { ExtractImageNumbersUseCase } from '../usecases/ExtractImageNumbersUseCase';

// Controllers
import { RecommendationController } from '../controllers/RecommendationController';
import { ReviewController } from '../controllers/ReviewController';
import { DataController } from '../controllers/DataController';
import { AuthController } from '../controllers/AuthController';
import { BoardController } from '../controllers/BoardController';

// Routes
import { createRecommendationRoutes, createImageRoutes } from './recommendationRoutes';
import { createReviewRoutes } from './reviewRoutes';
import { createDataRoutes } from './dataRoutes';
import { createAuthRoutes } from './authRoutes';
import { createBoardRoutes } from './boardRoutes';
import adminRoutes from './adminRoutes';

// Middleware
import { resetIPLimits } from '../middleware/ipLimitMiddleware';

// Dependency Injection Container
class DIContainer {
  private static instance: DIContainer;
  private prisma!: PrismaClient;
  
  // Repositories
  private recommendationHistoryRepository!: PrismaRecommendationHistoryRepository;
  private recommendationReviewRepository!: PrismaRecommendationReviewRepository;
  private winningNumbersRepository!: PrismaWinningNumbersRepository;
  private ipLimitRepository!: PrismaIPLimitRepository;
  private gptService!: OpenAIGPTService;
  
  // Services
  private ipLimitService!: IPLimitService;
  
  // Use Cases
  private generateRecommendationUseCase!: GenerateRecommendationUseCase;
  private generateReviewUseCase!: GenerateReviewUseCase;
  private extractImageNumbersUseCase!: ExtractImageNumbersUseCase;
  private boardPostUseCase!: any; // BoardPostUseCase
  
  // Controllers
  private recommendationController!: RecommendationController;
  private reviewController!: ReviewController;
  private dataController!: DataController;
  private authController!: AuthController;
  private boardController!: BoardController;

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
    this.recommendationHistoryRepository = new PrismaRecommendationHistoryRepository(this.prisma);
    this.recommendationReviewRepository = new PrismaRecommendationReviewRepository(this.prisma);
    this.winningNumbersRepository = new PrismaWinningNumbersRepository(this.prisma);
    this.ipLimitRepository = new PrismaIPLimitRepository(this.prisma);
    this.gptService = new OpenAIGPTService(env.OPENAI_API_KEY);

    // Services
    this.ipLimitService = IPLimitService.getInstance(this.ipLimitRepository);

    // Use Cases
    this.generateRecommendationUseCase = new GenerateRecommendationUseCase(
      this.recommendationHistoryRepository,
      this.winningNumbersRepository,
      this.gptService,
    );
    this.generateReviewUseCase = new GenerateReviewUseCase(
      this.recommendationHistoryRepository,
      this.recommendationReviewRepository,
      this.gptService,
    );
    this.extractImageNumbersUseCase = new ExtractImageNumbersUseCase(this.gptService);
    
    // Board Use Case
    const { BoardPostUseCase } = require('../usecases/BoardPostUseCase');
    const { PrismaBoardPostRepository } = require('../repositories/impl/PrismaBoardPostRepository');
    this.boardPostUseCase = new BoardPostUseCase(new PrismaBoardPostRepository(this.prisma));

    // Controllers
    this.recommendationController = new RecommendationController(
      this.generateRecommendationUseCase,
      this.extractImageNumbersUseCase,
      this.ipLimitService,
    );
    this.reviewController = new ReviewController(
      this.generateReviewUseCase,
      this.recommendationReviewRepository,
    );
    this.dataController = new DataController(
      this.recommendationHistoryRepository,
      this.winningNumbersRepository,
      this.ipLimitService,
    );
    this.authController = new AuthController();
    this.boardController = new BoardController(this.boardPostUseCase);
  }

  public getRecommendationController(): RecommendationController {
    return this.recommendationController;
  }

  public getReviewController(): ReviewController {
    return this.reviewController;
  }

  public getDataController(): DataController {
    return this.dataController;
  }

  public getAuthController(): AuthController {
    return this.authController;
  }

  public getBoardController(): BoardController {
    return this.boardController;
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

  // 각 라우트 그룹 등록
  router.use('/auth', createAuthRoutes(container.getAuthController()));
  router.use('/recommend', createRecommendationRoutes(
    container.getRecommendationController(),
    container.getIPLimitService()
  ));
  router.use('/image', createImageRoutes(container.getRecommendationController()));
  router.use('/review', createReviewRoutes(container.getReviewController()));
  router.use('/data', createDataRoutes(container.getDataController()));
  router.use('/board', createBoardRoutes(container.getBoardController()));
  router.use('/admin', adminRoutes);

  return router;
};

// 컨테이너 export (정리용)
export { DIContainer }; 