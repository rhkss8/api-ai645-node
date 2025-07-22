import 'reflect-metadata';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import passport from 'passport';
import cookieParser from 'cookie-parser';

import env from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { ApiResponse, HealthCheckResponse } from './types/common';
import { createApiRoutes, DIContainer } from './routes/index';
import { globalErrorHandler, notFoundHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimiter';
import { LottoScheduler } from './batch/LottoScheduler';
import { initPassportStrategies } from './auth/providers';
import { startTokenRefreshWorker } from './jobs/providerTokenRefresh';

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
app.use(generalLimiter);

// CORS configuration
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Passport initialization
app.use(passport.initialize());
initPassportStrategies();

// Logging middleware
if (env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lottery Recommendation API',
      version: '1.0.0',
      description: 'AI-powered lottery number recommendation service with TypeScript and Clean Architecture',
    },
    servers: [
      {
        url: `http://localhost:3350`,
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: '소셜 로그인 및 인증 관련 API',
      },
      {
        name: 'Recommendations',
        description: '로또 번호 추천 관련 API',
      },
      {
        name: 'Image Processing',
        description: '이미지 처리 관련 API',
      },
      {
        name: 'Reviews',
        description: '추천 회고 분석 관련 API',
      },
      {
        name: 'Data',
        description: '데이터 조회 관련 API',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT 액세스 토큰을 Bearer 형식으로 전달',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: '에러 메시지' },
            message: { type: 'string', example: '상세 설명', nullable: true },
            data: { type: 'object', nullable: true },
            timestamp: { type: 'string', format: 'date-time', example: '2025-06-23T12:00:00.000Z' }
          },
          required: ['success', 'error', 'timestamp']
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string', description: 'JWT 액세스 토큰' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    nickname: { type: 'string' },
                  },
                },
                expiresIn: { type: 'integer', description: '토큰 만료 시간 (초)' },
              },
            },
            message: { type: 'string', example: '로그인이 완료되었습니다.' },
          },
        },
      },
    },
  },
  apis: env.NODE_ENV === 'production' 
    ? ['./dist/routes/*.js'] 
    : ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// OpenAPI JSON spec 엔드포인트
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const response: HealthCheckResponse = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'disconnected', // 임시로 disconnected 상태
      environment: env.NODE_ENV,
      version: '1.0.0',
    };
    res.status(200).json(response);
  } catch (error) {
    const response: HealthCheckResponse = {
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      environment: env.NODE_ENV,
      version: '1.0.0',
    };
    res.status(500).json(response);
  }
});

// Root endpoint
app.get('/', (req, res) => {
  const response: ApiResponse = {
    success: true,
    message: '🚀 Lottery Recommendation API Server (TypeScript + Clean Architecture)',
    data: {
      version: '1.0.0',
      environment: env.NODE_ENV,
      status: 'All systems operational',
      features: [
        '무료 번호 추천 (GPT-3.5-turbo)',
        '프리미엄 번호 추천 (GPT-4o)',
        '이미지 번호 추출 (GPT-4o Vision)',
        '추천 결과 회고 분석',
        'Clean Architecture 구조',
        'TypeScript 완전 지원',
      ],
      endpoints: {
        health: '/health',
        docs: '/api-docs',
        recommend: {
          free: 'POST /api/recommend/free',
          premium: 'POST /api/recommend/premium',
        },
        image: {
          extract: 'POST /api/image/extract',
        },
        review: {
          generate: 'POST /api/review/generate',
          list: 'GET /api/review',
          byId: 'GET /api/review/:id',
        },
        data: {
          recommendations: 'GET /api/data/recommendations',
          winningNumbers: 'GET /api/data/winning-numbers/latest',
        },
      },
    },
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

// Test route for debugging
app.get('/test', (req, res) => {
  res.json({ message: 'Test route works!' });
});

// API routes
app.use('/api', createApiRoutes());

// 404 handler
app.use('*', notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Server startup
const startServer = async (): Promise<void> => {
  try {
    // Connect to database - 임시로 비활성화
    await connectDatabase();
    
    // Start lotto scheduler
    const lottoScheduler = new LottoScheduler();
    lottoScheduler.startScheduler();
    
    // Start token refresh worker
    startTokenRefreshWorker();
    
    // Start server
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`
🚀 TypeScript 로또 추천 API 서버가 시작되었습니다!
📡 포트: ${env.PORT}
🌍 환경: ${env.NODE_ENV}
📍 URL: http://localhost:${env.PORT}
🏥 Health Check: http://localhost:${env.PORT}/health
📚 API Docs: http://localhost:${env.PORT}/api-docs

🎯 주요 API 엔드포인트:
   • 무료 추천: POST /api/recommend/free
   • 프리미엄 추천: POST /api/recommend/premium
   • 이미지 추출: POST /api/image/extract
   • 회고 생성: POST /api/review/generate
   • 데이터 조회: GET /api/data/recommendations

✅ 데이터베이스: 연결됨
🔧 Clean Architecture + TypeScript 구조 적용 완료
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = async (): Promise<void> => {
      console.log('\n시그널을 받았습니다. 서버를 종료합니다...');
      
      server.close(async () => {
        console.log('서버가 종료되었습니다.');
        
        // 의존성 컨테이너 정리
        try {
          const container = DIContainer.getInstance();
          await container.closeDatabase();
          console.log('데이터베이스 연결이 종료되었습니다.');
        } catch (error) {
          console.error('데이터베이스 종료 중 오류:', error);
        }
        
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
};

// Start the server
void startServer();

export default app; 