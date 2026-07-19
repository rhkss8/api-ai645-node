import { Request, Response } from 'express';
import { OrderStatus, PaymentStatus, PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type AdminDateRange = {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
  days: number;
};

type DailyMetricRow = {
  date: Date;
  signup_count: bigint | number;
  payment_attempt_count: bigint | number;
  completed_payment_count: bigint | number;
  revenue: bigint | number | null;
};

type CategoryMetricRow = {
  category: string | null;
  attempt_count: bigint | number;
  completed_count: bigint | number;
  revenue: bigint | number | null;
};

const toNumber = (value: bigint | number | null | undefined): number => Number(value ?? 0);

const maskEmail = (email?: string | null): string | null => {
  if (!email) return null;

  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return null;

  const visible = localPart.slice(0, Math.min(2, localPart.length));
  return `${visible}${'*'.repeat(Math.max(localPart.length - visible.length, 2))}@${domain}`;
};

const parseDateRange = (req: Request): AdminDateRange => {
  const daysParam = parseInt(req.query.days as string, 10);
  const requestedDays = Number.isFinite(daysParam) ? daysParam : 7;
  const days = Math.min(Math.max(requestedDays, 1), 90);

  const now = new Date();
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : now;
  if (Number.isNaN(endDate.getTime())) {
    throw new Error('유효하지 않은 endDate입니다.');
  }

  const startDate = req.query.startDate
    ? new Date(req.query.startDate as string)
    : new Date(endDate.getTime() - (days - 1) * MS_PER_DAY);
  if (Number.isNaN(startDate.getTime())) {
    throw new Error('유효하지 않은 startDate입니다.');
  }

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const periodMs = endDate.getTime() - startDate.getTime() + 1;
  const previousEndDate = new Date(startDate.getTime() - 1);
  const previousStartDate = new Date(previousEndDate.getTime() - periodMs + 1);

  return {
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
    days,
  };
};

const calculateRate = (numerator: number, denominator: number): number =>
  denominator > 0 ? Number(((numerator / denominator) * 100).toFixed(2)) : 0;

export class AdminController {
  /**
   * 운영 대시보드 요약 조회 (관리자 전용, 읽기 전용)
   */
  public getDashboardSummary = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { startDate, endDate, previousStartDate, previousEndDate, days } = parseDateRange(req);

      const [
        totalUsers,
        periodSignups,
        previousPeriodSignups,
        ordersCreated,
        paymentsCreated,
        completedPayments,
        failedPayments,
        cancelledPayments,
        pendingPayments,
        paidOrderCount,
        documentResults,
        fortuneSessions,
        completedAmount,
        dailyRows,
        categoryRows,
      ] = await Promise.all([
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.user.count({
          where: {
            deletedAt: null,
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.user.count({
          where: {
            deletedAt: null,
            createdAt: { gte: previousStartDate, lte: previousEndDate },
          },
        }),
        prisma.order.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        }),
        prisma.payment.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        }),
        prisma.payment.count({
          where: {
            status: PaymentStatus.COMPLETED,
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.payment.count({
          where: {
            status: PaymentStatus.FAILED,
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.payment.count({
          where: {
            status: { in: [PaymentStatus.CANCELLED, PaymentStatus.USER_CANCELLED, PaymentStatus.REFUNDED] },
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.payment.count({
          where: {
            status: PaymentStatus.PENDING,
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.order.count({
          where: {
            status: OrderStatus.PAID,
            createdAt: { gte: startDate, lte: endDate },
          },
        }),
        prisma.documentResult.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        }),
        prisma.fortuneSession.count({
          where: { createdAt: { gte: startDate, lte: endDate } },
        }),
        prisma.payment.aggregate({
          where: {
            status: PaymentStatus.COMPLETED,
            createdAt: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
        prisma.$queryRaw<DailyMetricRow[]>`
          SELECT
            day::date AS date,
            COALESCE(signups.count, 0) AS signup_count,
            COALESCE(attempts.count, 0) AS payment_attempt_count,
            COALESCE(completed.count, 0) AS completed_payment_count,
            COALESCE(completed.revenue, 0) AS revenue
          FROM generate_series(${startDate}::date, ${endDate}::date, '1 day') AS days(day)
          LEFT JOIN (
            SELECT date_trunc('day', "createdAt")::date AS date, COUNT(*) AS count
            FROM users
            WHERE "deletedAt" IS NULL AND "createdAt" BETWEEN ${startDate} AND ${endDate}
            GROUP BY 1
          ) signups ON signups.date = day::date
          LEFT JOIN (
            SELECT date_trunc('day', "createdAt")::date AS date, COUNT(*) AS count
            FROM payments
            WHERE "createdAt" BETWEEN ${startDate} AND ${endDate}
            GROUP BY 1
          ) attempts ON attempts.date = day::date
          LEFT JOIN (
            SELECT date_trunc('day', "createdAt")::date AS date, COUNT(*) AS count, SUM(amount) AS revenue
            FROM payments
            WHERE status = 'COMPLETED' AND "createdAt" BETWEEN ${startDate} AND ${endDate}
            GROUP BY 1
          ) completed ON completed.date = day::date
          ORDER BY day ASC
        `,
        prisma.$queryRaw<CategoryMetricRow[]>`
          SELECT
            COALESCE(o.metadata->>'category', 'UNKNOWN') AS category,
            COUNT(p.id) AS attempt_count,
            COUNT(p.id) FILTER (WHERE p.status = 'COMPLETED') AS completed_count,
            COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'COMPLETED'), 0) AS revenue
          FROM payments p
          INNER JOIN orders o ON o.id = p."orderId"
          WHERE p."createdAt" BETWEEN ${startDate} AND ${endDate}
          GROUP BY 1
          ORDER BY revenue DESC, attempt_count DESC
          LIMIT 10
        `,
      ]);

      const revenue = completedAmount._sum.amount || 0;

      res.json({
        success: true,
        data: {
          period: {
            days,
            startDate,
            endDate,
            previousStartDate,
            previousEndDate,
          },
          users: {
            total: totalUsers,
            signups: periodSignups,
            previousSignups: previousPeriodSignups,
            signupChange: periodSignups - previousPeriodSignups,
          },
          payments: {
            attempts: paymentsCreated,
            completed: completedPayments,
            failed: failedPayments,
            cancelled: cancelledPayments,
            pending: pendingPayments,
            revenue,
            completionRate: calculateRate(completedPayments, paymentsCreated),
            averageRevenuePerCompletedPayment:
              completedPayments > 0 ? Math.round(revenue / completedPayments) : 0,
          },
          funnel: {
            ordersCreated,
            paymentsCreated,
            paidOrderCount,
            completedPayments,
            fortuneSessions,
            documentResults,
            signupToPaymentAttemptRate: calculateRate(paymentsCreated, periodSignups),
            paymentCompletionRate: calculateRate(completedPayments, paymentsCreated),
          },
          daily: dailyRows.map(row => ({
            date: row.date,
            signups: toNumber(row.signup_count),
            paymentAttempts: toNumber(row.payment_attempt_count),
            completedPayments: toNumber(row.completed_payment_count),
            revenue: toNumber(row.revenue),
          })),
          categoryStats: categoryRows.map(row => ({
            category: row.category || 'UNKNOWN',
            attempts: toNumber(row.attempt_count),
            completed: toNumber(row.completed_count),
            revenue: toNumber(row.revenue),
            completionRate: calculateRate(toNumber(row.completed_count), toNumber(row.attempt_count)),
          })),
        },
        message: '관리자 대시보드 요약을 성공적으로 조회했습니다.',
      });
    }
  );

  /**
   * 결제 시도 목록 조회 (관리자 전용, 읽기 전용)
   */
  public getDashboardPayments = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { startDate, endDate } = parseDateRange(req);
      const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 20, 1), 100);
      const offset = (page - 1) * limit;
      const status = req.query.status as PaymentStatus | undefined;

      const statusWhere = status && Object.values(PaymentStatus).includes(status)
        ? { status }
        : {};

      const where = {
        ...statusWhere,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            order: {
              select: {
                id: true,
                merchantUid: true,
                orderName: true,
                status: true,
                metadata: true,
                createdAt: true,
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    email: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        prisma.payment.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          payments: payments.map(payment => {
            const metadata = payment.order.metadata as Record<string, unknown> | null;

            return {
              id: payment.id,
              orderId: payment.orderId,
              merchantUid: payment.order.merchantUid,
              orderName: payment.order.orderName,
              amount: payment.amount,
              currency: payment.currency,
              status: payment.status,
              orderStatus: payment.order.status,
              payMethod: payment.payMethod,
              easyPayProvider: payment.easyPayProvider,
              pgProvider: payment.pgProvider,
              paidAt: payment.paidAt,
              createdAt: payment.createdAt,
              updatedAt: payment.updatedAt,
              user: {
                id: payment.order.user.id,
                nickname: payment.order.user.nickname,
                maskedEmail: maskEmail(payment.order.user.email),
              },
              product: {
                productId: metadata?.productId || null,
                productType: metadata?.productType || null,
                category: metadata?.category || null,
                finalAmount: metadata?.finalAmount || payment.amount,
              },
            };
          }),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: offset + limit < total,
            hasPrev: page > 1,
          },
        },
        message: '관리자 결제 시도 목록을 성공적으로 조회했습니다.',
      });
    }
  );

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
