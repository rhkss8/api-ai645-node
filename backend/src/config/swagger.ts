import swaggerJsdoc from 'swagger-jsdoc';

type SwaggerServer = {
  url: string;
  description: string;
};

function getSwaggerServer(): SwaggerServer {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    url: isProduction ? 'https://api.44tune.co.kr' : 'http://localhost:3350',
    description: isProduction ? 'Production server' : 'Development server',
  };
}

export function getSwaggerOptions() {
  return {
    definition: {
      openapi: '3.0.0',
      info: {
        title: '포포춘(For Fortune) 운세 API',
        version: '2.0.0',
        description: 'AI 기반 운세 상담 플랫폼 - 사주, 타로, 꿈해몽, 행운번호 등',
      },
      servers: [getSwaggerServer()],
      tags: [
        {
          name: 'Authentication',
          description: '소셜 로그인 및 인증 관련 API',
        },
        {
          name: 'Fortune',
          description: '운세 서비스 관련 API (채팅형/문서형)',
        },
        {
          name: 'Board',
          description: '게시판 관련 API',
        },
        {
          name: 'Admin',
          description: '관리자 관련 API',
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
              timestamp: { type: 'string', format: 'date-time', example: '2025-06-23T12:00:00.000Z' },
            },
            required: ['success', 'error', 'timestamp'],
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
    apis: [
      './src/routes/*.ts',
    ],
  };
}

export function buildSwaggerSpec() {
  return swaggerJsdoc(getSwaggerOptions());
}
