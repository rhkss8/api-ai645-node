import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import env from '../config/env';
import { CleanupExpiredSessionsUseCase } from '../usecases/CleanupExpiredSessionsUseCase';
import { PrismaFortuneSessionRepository } from '../repositories/impl/PrismaFortuneSessionRepository';
import { PrismaConversationLogRepository } from '../repositories/impl/PrismaConversationLogRepository';

export class CleanupScheduler {
  private readonly prisma: PrismaClient;
  private readonly cleanupSessionsUseCase: CleanupExpiredSessionsUseCase;

  constructor() {
    this.prisma = new PrismaClient();
    const sessionRepository = new PrismaFortuneSessionRepository(this.prisma);
    const logRepository = new PrismaConversationLogRepository(this.prisma);
    this.cleanupSessionsUseCase = new CleanupExpiredSessionsUseCase(
      sessionRepository,
      logRepository,
    );
  }

  /**
   * 레거시 도메인 잔재 정리 placeholder
   * 실제 정리 로직은 recommendation schema migration 시점에 확정한다.
   */
  async cleanupLegacyRecommendationArtifacts(): Promise<void> {
    try {
      console.log('🧹 레거시 도메인 잔재 정리 시작...');
      
      // 일단 간단하게 로그만 출력
      console.log('✅ 레거시 도메인 잔재 정리 완료 (개발 중)');
      
    } catch (error) {
      console.error('❌ 레거시 도메인 잔재 정리 실패:', error);
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
   * 만료된 운세 세션 정리
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      console.log('🧹 만료된 운세 세션 정리 시작...');
      
      const result = await this.cleanupSessionsUseCase.execute();
      
      console.log(`✅ 만료된 운세 세션 ${result.cleanedCount}개 정리 완료`);
    } catch (error) {
      console.error('❌ 만료된 운세 세션 정리 실패:', error);
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
      
      // 매시간 정각 - 레거시 도메인 잔재 정리
      cron.schedule('0 * * * *', async () => {
        console.log('⏰ 레거시 도메인 잔재 정리 실행');
        await this.cleanupLegacyRecommendationArtifacts();
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

      // 매시간 30분 - 만료된 운세 세션 정리
      cron.schedule('30 * * * *', async () => {
        console.log('⏰ 만료된 운세 세션 정리 실행');
        await this.cleanupExpiredSessions();
      });

      console.log('✅ 정리 스케줄러 등록 완료 (프로덕션):');
      console.log('  - 매시간: 레거시 도메인 잔재 정리');
      console.log('  - 매시간 30분: 만료된 운세 세션 정리');
      console.log('  - 매일 02:00: 결제 실패한 주문 정리');
      console.log('  - 매일 03:00: 사용자 활동 통계 수집');
      
    } else {
      // 개발 환경: 테스트용 빈번한 실행
      cron.schedule('*/5 * * * *', async () => {
        console.log('⏰ 정리 작업 실행 (개발용 - 5분마다)');
        await this.cleanupLegacyRecommendationArtifacts();
        await this.cleanupFailedOrders();
        await this.cleanupExpiredSessions();
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
    await this.cleanupLegacyRecommendationArtifacts();
    await this.cleanupFailedOrders();
    await this.cleanupExpiredSessions();
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
