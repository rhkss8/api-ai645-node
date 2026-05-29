import 'reflect-metadata';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import * as yaml from 'js-yaml';

import env from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { ApiResponse, HealthCheckResponse } from './types/common';
import { createApiRoutes, DIContainer } from './routes/index';
import { globalErrorHandler, notFoundHandler } from './middlewares/errorHandler';
import { generalLimiter } from './middlewares/rateLimiter';
import { CleanupScheduler } from './batch/CleanupScheduler';
import { initPassportStrategies } from './auth/providers';
import { startTokenRefreshWorker } from './jobs/providerTokenRefresh';
import { buildSwaggerSpec } from './config/swagger';

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

const specs = buildSwaggerSpec();
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// OpenAPI JSON spec 엔드포인트 (다양한 경로 지원)
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

app.get('/api-docs-json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// YAML 형태의 OpenAPI 스펙 제공
app.get('/openapi.yaml', (req, res) => {
  res.setHeader('Content-Type', 'application/x-yaml');
  res.send(yaml.dump(specs));
});

app.get('/swagger.yaml', (req, res) => {
  res.setHeader('Content-Type', 'application/x-yaml');
  res.send(yaml.dump(specs));
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
    message: '🔮 포포춘(For Fortune) 운세 API 서버',
    data: {
      version: '2.0.0',
      environment: env.NODE_ENV,
      status: 'All systems operational',
      features: [
        '채팅형 운세 상담 (GPT-4o)',
        '문서형 운세 리포트 (GPT-4o)',
        '12가지 운세 카테고리',
        '홍시(복채) 기반 시간 관리',
        'Clean Architecture 구조',
        'TypeScript 완전 지원',
      ],
      endpoints: {
        health: '/health',
        docs: '/api-docs',
        fortune: {
          session: 'POST /api/fortune/session',
          chat: 'POST /api/fortune/chat',
          document: 'POST /api/fortune/document',
          hongsi: 'POST /api/fortune/hongsi/purchase',
        },
        auth: {
          login: 'POST /api/auth/login',
          register: 'POST /api/auth/register',
        },
        board: {
          posts: 'GET /api/board/:category',
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
const apiRoutes = createApiRoutes();
app.use('/api', apiRoutes);

// 라우트 등록 확인 로그
console.log('🔍 등록된 라우트 확인:');
console.log('  - /api/auth/* (Authentication)');
console.log('  - /api/fortune/* (Fortune Service)');
console.log('  - /api/board/* (Board)');
console.log('  - /api/admin/* (Admin)');

// 404 handler
app.use('*', notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Server startup
const startServer = async (): Promise<void> => {
  try {
    // Connect to database
    await connectDatabase();

    // Start cleanup scheduler
    const cleanupScheduler = new CleanupScheduler();
    cleanupScheduler.start();
    
    // Start token refresh worker
    startTokenRefreshWorker();
    
    // Start server
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`
🔮 포포춘(For Fortune) 운세 API 서버가 시작되었습니다!
📡 포트: ${env.PORT}
🌍 환경: ${env.NODE_ENV}
📍 URL: http://localhost:${env.PORT}
🏥 Health Check: http://localhost:${env.PORT}/health
📚 API Docs: http://localhost:${env.PORT}/api-docs

🎯 주요 API 엔드포인트:
   • 운세 세션 생성: POST /api/fortune/session
   • 채팅형 운세: POST /api/fortune/chat
   • 문서형 리포트: POST /api/fortune/document
   • 홍시 구매: POST /api/fortune/hongsi/purchase
   • 세션 시간 연장: POST /api/fortune/session/:id/extend

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

export default app; // Force rebuild for production: Tue Aug  5 23:57:33 KST 2025
// Force production rebuild: Tue Aug  5 23:59:54 KST 2025
// Fix production permissions: Wed Aug  6 00:26:46 KST 2025
