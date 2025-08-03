import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import env from '../config/env';

export class CleanupScheduler {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * 만료된 RecommendationParams 정리 (간단 버전)
   */
  async cleanupExpiredParams(): Promise<void> {
    try {
      console.log('🧹 만료된 추천 파라미터 정리 시작...');
      
      // 일단 간단하게 로그만 출력
      console.log('✅ 만료된 파라미터 정리 완료 (개발 중)');
      
    } catch (error) {
      console.error('❌ 만료된 파라미터 정리 실패:', error);
    }
  }

  /**
   * 결제 실패한 주문 정리 (간단 버전)
   */
  async cleanupFailedOrders(): Promise<void> {
    try {
      console.log('🧹 결제 실패한 주문 정리 시작...');
      
      // 일단 간단하게 로그만 출력
      console.log('✅ 결제 실패한 주문 정리 완료 (개발 중)');
      
    } catch (error) {
      console.error('❌ 결제 실패한 주문 정리 실패:', error);
    }
  }

  /**
   * 사용자 활동 통계 수집 (간단 버전)
   */
  async collectUserActivityStats(): Promise<void> {
    try {
      console.log('📊 사용자 활동 통계 수집 시작...');

      const totalUsers = await this.prisma.user.count();
      const totalOrders = await this.prisma.order.count();
      
      console.log('📈 기본 통계:', {
        totalUsers,
        totalOrders
      });

      console.log('✅ 사용자 활동 통계 수집 완료');

    } catch (error) {
      console.error('❌ 사용자 활동 통계 수집 실패:', error);
    }
  }

  /**
   * 스케줄러 시작
   */
  start(): void {
    console.log('🧹 정리 스케줄러 시작...');

    const isProduction = env.NODE_ENV === 'production';

    if (isProduction) {
      // 프로덕션 환경: 실제 운영 스케줄
      
      // 매시간 정각 - 만료된 파라미터 정리
      cron.schedule('0 * * * *', async () => {
        console.log('⏰ 만료된 파라미터 정리 실행');
        await this.cleanupExpiredParams();
      });

      // 매일 새벽 2시 - 결제 실패한 주문 정리
      cron.schedule('0 2 * * *', async () => {
        console.log('⏰ 결제 실패한 주문 정리 실행');
        await this.cleanupFailedOrders();
      });

      // 매일 새벽 3시 - 사용자 활동 통계 수집
      cron.schedule('0 3 * * *', async () => {
        console.log('⏰ 사용자 활동 통계 수집 실행');
        await this.collectUserActivityStats();
      });

      console.log('✅ 정리 스케줄러 등록 완료 (프로덕션):');
      console.log('  - 매시간: 만료된 파라미터 정리');
      console.log('  - 매일 02:00: 결제 실패한 주문 정리');
      console.log('  - 매일 03:00: 사용자 활동 통계 수집');
      
    } else {
      // 개발 환경: 테스트용 빈번한 실행
      cron.schedule('*/5 * * * *', async () => {
        console.log('⏰ 정리 작업 실행 (개발용 - 5분마다)');
        await this.cleanupExpiredParams();
        await this.cleanupFailedOrders();
        await this.collectUserActivityStats();
      });

      console.log('✅ 정리 스케줄러 등록 완료 (개발환경): 5분마다 실행');
    }
  }

  /**
   * 수동 실행 (테스트용)
   */
  async manualCleanup(): Promise<void> {
    console.log('🧹 수동 정리 작업 실행');
    await this.cleanupExpiredParams();
    await this.cleanupFailedOrders();
    await this.collectUserActivityStats();
    console.log('✅ 수동 정리 작업 완료');
  }

  /**
   * 정리
   */
  async destroy(): Promise<void> {
    await this.prisma.$disconnect();
  }
} 