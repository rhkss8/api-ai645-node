import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient;

export const createPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      errorFormat: 'pretty',
    });
  }
  return prismaInstance;
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
    if (prismaInstance) {
      await prismaInstance.$disconnect();
      console.log('✅ 데이터베이스 연결 종료');
    }
  } catch (error) {
    console.error('❌ 데이터베이스 연결 종료 실패:', error);
    throw error;
  }
};

export const prisma = createPrismaClient();
export default createPrismaClient; 