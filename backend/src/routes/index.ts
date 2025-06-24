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

// Routes
import { createRecommendationRoutes, createImageRoutes } from './recommendationRoutes';
import { createReviewRoutes } from './reviewRoutes';
import { createDataRoutes } from './dataRoutes';

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
  
  // Controllers
  private recommendationController!: RecommendationController;
  private reviewController!: ReviewController;
  private dataController!: DataController;

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
      this.gptService,
    );
    this.generateReviewUseCase = new GenerateReviewUseCase(
      this.recommendationHistoryRepository,
      this.recommendationReviewRepository,
      this.gptService,
    );
    this.extractImageNumbersUseCase = new ExtractImageNumbersUseCase(this.gptService);

    // Controllers
    this.recommendationController = new RecommendationController(
      this.generateRecommendationUseCase,
      this.extractImageNumbersUseCase,
    );
    this.reviewController = new ReviewController(
      this.generateReviewUseCase,
      this.recommendationReviewRepository,
    );
    this.dataController = new DataController(
      this.recommendationHistoryRepository,
      this.winningNumbersRepository,
    );
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

  // 각 라우트 그룹 등록
  router.use('/recommend', createRecommendationRoutes(
    container.getRecommendationController(),
    container.getIPLimitService()
  ));
  router.use('/image', createImageRoutes(container.getRecommendationController()));
  router.use('/review', createReviewRoutes(container.getReviewController()));
  router.use('/data', createDataRoutes(container.getDataController()));

  return router;
};

// 컨테이너 export (정리용)
export { DIContainer }; 