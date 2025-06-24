import dotenv from 'dotenv';

dotenv.config();

export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  OPENAI_API_KEY: string;
  JWT_SECRET: string;
  CORS_ORIGIN: string | string[];
  LOG_LEVEL: string;
  API_VERSION: string;
}

const requiredEnvVars = [
  'DATABASE_URL',
  'OPENAI_API_KEY',
  'JWT_SECRET',
] as const;

export const validateEnvironment = (): EnvironmentConfig => {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`필수 환경변수가 설정되지 않았습니다: ${envVar}`);
    }
  }

  // CORS_ORIGIN 파싱 (콤마로 구분된 여러 도메인 지원)
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const parsedCorsOrigin = corsOrigin === '*' 
    ? '*' 
    : corsOrigin.split(',').map(origin => origin.trim());

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '4000', 10),
    DATABASE_URL: process.env.DATABASE_URL!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    JWT_SECRET: process.env.JWT_SECRET!,
    CORS_ORIGIN: parsedCorsOrigin,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    API_VERSION: process.env.API_VERSION || 'v1',
  };
};

export const env = validateEnvironment();

export default env; 