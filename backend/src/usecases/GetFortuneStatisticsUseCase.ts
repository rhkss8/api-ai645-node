/**
 * 운세 서비스 통계 UseCase
 */
import { PrismaClient } from '@prisma/client';
import { FortuneCategory } from '../types/fortune';

export class GetFortuneStatisticsUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(userId?: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    totalDocuments: number;
    categoryUsage: Record<string, number>;
    totalChats: number;
    popularCategories: Array<{ category: string; count: number }>;
  }> {
    const where = userId ? { userId } : {};

    // 전체 세션 수
    const totalSessions = await this.prisma.fortuneSession.count({
      where,
    });

    // 활성 세션 수
    const activeSessions = await this.prisma.fortuneSession.count({
      where: {
        ...where,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // 전체 문서 수
    const totalDocuments = await this.prisma.documentResult.count({
      where,
    });

    // 전체 채팅 수
    const totalChats = await this.prisma.conversationLog.count({
      where: userId
        ? {
            session: {
              userId,
            },
          }
        : {},
    });

    // 카테고리별 사용 통계
    const categoryStats = await this.prisma.fortuneSession.groupBy({
      by: ['category'],
      where,
      _count: {
        category: true,
      },
    });

    const categoryUsage: Record<string, number> = {};
    categoryStats.forEach((stat) => {
      categoryUsage[stat.category] = stat._count.category;
    });

    // 인기 카테고리 (상위 5개)
    const popularCategories = categoryStats
      .map((stat) => ({
        category: stat.category,
        count: stat._count.category,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSessions,
      activeSessions,
      totalDocuments,
      categoryUsage,
      totalChats,
      popularCategories,
    };
  }
}
