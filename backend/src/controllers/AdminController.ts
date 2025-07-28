import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

export class AdminController {
  /**
   * 전체 사용자 목록 조회 (관리자 전용)
   */
  public getAllUsers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const users = await prisma.user.findMany({
        where: {
          deletedAt: null,
        },
        include: {
          socialAccounts: {
            select: {
              provider: true,
              providerUid: true,
              createdAt: true,
            },
          },
          subscriptions: {
            where: {
              status: 'active',
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          _count: {
            select: {
              recommendations: true,
              orders: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      });

      const total = await prisma.user.count({
        where: {
          deletedAt: null,
        },
      });

      res.json({
        success: true,
        data: {
          users: users.map(user => ({
            id: user.id,
            nickname: user.nickname,
            role: user.role,
            createdAt: user.createdAt,
            authType: user.socialAccounts[0]?.provider || null,
            hasActiveSubscription: user.subscriptions.length > 0,
            subscriptionEndDate: user.subscriptions[0]?.endDate || null,
            recommendationCount: user._count.recommendations,
            paymentCount: user._count.orders,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: offset + limit < total,
            hasPrev: page > 1,
          },
        },
        message: '사용자 목록을 성공적으로 조회했습니다.',
      });
    }
  );

  /**
   * 사용자 역할 변경 (관리자 전용)
   */
  public updateUserRole = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { userId } = req.params;
      const { role } = req.body;

      if (!role || !['USER', 'ADMIN'].includes(role)) {
        res.status(400).json({
          success: false,
          error: '유효하지 않은 역할입니다.',
          message: '역할은 USER 또는 ADMIN이어야 합니다.',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: '사용자를 찾을 수 없습니다.',
          message: '존재하지 않는 사용자입니다.',
        });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
        include: {
          socialAccounts: {
            select: {
              provider: true,
              providerUid: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: {
          id: updatedUser.id,
          nickname: updatedUser.nickname,
          role: updatedUser.role,
          authType: updatedUser.socialAccounts[0]?.provider || null,
        },
        message: '사용자 역할이 성공적으로 변경되었습니다.',
      });
    }
  );

  /**
   * API 사용 통계 조회 (관리자 전용)
   */
  public getApiStats = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 기본 30일
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      // 전체 API 사용량
      const totalUsage = await prisma.apiUsage.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // 성공/실패 통계
      const successCount = await prisma.apiUsage.count({
        where: {
          success: true,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const failureCount = await prisma.apiUsage.count({
        where: {
          success: false,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // 엔드포인트별 사용량
      const endpointStats = await prisma.apiUsage.groupBy({
        by: ['endpoint'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: {
          endpoint: true,
        },
        _sum: {
          tokenUsed: true,
          cost: true,
        },
      });

      // GPT 모델별 사용량
      const modelStats = await prisma.apiUsage.groupBy({
        by: ['gptModel'],
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          gptModel: {
            not: null,
          },
        },
        _count: {
          gptModel: true,
        },
        _sum: {
          tokenUsed: true,
          cost: true,
        },
      });

      // 총 비용
      const totalCost = await prisma.apiUsage.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        _sum: {
          cost: true,
        },
      });

      res.json({
        success: true,
        data: {
          period: {
            startDate,
            endDate,
          },
          overview: {
            totalRequests: totalUsage,
            successCount,
            failureCount,
            successRate: totalUsage > 0 ? (successCount / totalUsage * 100).toFixed(2) : 0,
            totalCost: totalCost._sum.cost || 0,
          },
          endpointStats: endpointStats.map(stat => ({
            endpoint: stat.endpoint,
            requestCount: stat._count.endpoint,
            totalTokens: stat._sum.tokenUsed || 0,
            totalCost: stat._sum.cost || 0,
          })),
          modelStats: modelStats.map(stat => ({
            model: stat.gptModel,
            requestCount: stat._count.gptModel,
            totalTokens: stat._sum.tokenUsed || 0,
            totalCost: stat._sum.cost || 0,
          })),
        },
        message: 'API 통계를 성공적으로 조회했습니다.',
      });
    }
  );

  /**
   * 시스템 상태 조회 (관리자 전용)
   */
  public getSystemStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      // 사용자 통계
      const totalUsers = await prisma.user.count({
        where: { deletedAt: null },
      });

      const activeSubscriptions = await prisma.subscription.count({
        where: {
          status: 'active',
          endDate: {
            gt: new Date(),
          },
        },
      });

      // 추천 내역 통계
      const totalRecommendations = await prisma.recommendationHistory.count();
      const todayRecommendations = await prisma.recommendationHistory.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      });

      // 결제 통계
      const totalPayments = await prisma.payment.count();
      const completedPayments = await prisma.payment.count({
        where: { status: 'COMPLETED' },
      });

      // 데이터베이스 크기 (대략적)
      const dbSize = await prisma.$queryRaw`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;

      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            activeSubscriptions,
          },
          recommendations: {
            total: totalRecommendations,
            today: todayRecommendations,
          },
          payments: {
            total: totalPayments,
            completed: completedPayments,
            completionRate: totalPayments > 0 ? (completedPayments / totalPayments * 100).toFixed(2) : 0,
          },
          system: {
            databaseSize: (dbSize as any[])[0]?.size || 'Unknown',
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
          },
        },
        message: '시스템 상태를 성공적으로 조회했습니다.',
      });
    }
  );
} 