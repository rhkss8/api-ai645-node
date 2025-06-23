import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export const createPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });
  }
  return prisma;
};

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = createPrismaClient();
    await client.$connect();
    console.log('✅ 데이터베이스 연결 성공');
  } catch (error) {
    console.error('❌ 데이터베이스 연결 실패:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      console.log('✅ 데이터베이스 연결 종료');
    }
  } catch (error) {
    console.error('❌ 데이터베이스 연결 종료 실패:', error);
    throw error;
  }
};

export { prisma };
export default createPrismaClient; 