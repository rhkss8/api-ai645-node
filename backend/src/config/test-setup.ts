import { PrismaClient } from '@prisma/client';

// Mock Prisma client for testing
const prismaMock = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  recommendationHistory: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  recommendationReview: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  winningNumbers: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  apiUsage: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.JWT_SECRET = 'test-secret';

// Set global test timeout
jest.setTimeout(30000);

export { prismaMock }; 