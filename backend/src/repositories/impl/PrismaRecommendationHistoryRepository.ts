import { PrismaClient } from '@prisma/client';
import { RecommendationHistory } from '../../entities/RecommendationHistory';
import { IRecommendationHistoryRepository } from '../IRecommendationHistoryRepository';
import { RecommendationType, WinStatus } from '../../types/common';

export class PrismaRecommendationHistoryRepository implements IRecommendationHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(recommendation: RecommendationHistory): Promise<RecommendationHistory> {
    const created = await this.prisma.recommendationHistory.create({
      data: {
        id: recommendation.id,
        userId: recommendation.userId,
        round: recommendation.round,
        numbers: recommendation.numbers,
        type: recommendation.type,
        conditions: recommendation.conditions ? JSON.parse(JSON.stringify(recommendation.conditions)) : undefined,
        imageData: recommendation.imageData ? JSON.parse(JSON.stringify(recommendation.imageData)) : undefined,
        gptModel: recommendation.gptModel,
        analysis: recommendation.analysis,
        orderId: recommendation.orderId,
        createdAt: recommendation.createdAt,
        updatedAt: recommendation.updatedAt,
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<RecommendationHistory | null> {
    const recommendation = await this.prisma.recommendationHistory.findUnique({
      where: { id },
    });

    return recommendation ? this.toDomain(recommendation) : null;
  }

  async findByRound(round: number): Promise<RecommendationHistory[]> {
    const recommendations = await this.prisma.recommendationHistory.findMany({
      where: { round },
      orderBy: { createdAt: 'desc' },
    });

    return recommendations.map(this.toDomain);
  }

  async findByType(type: RecommendationType): Promise<RecommendationHistory[]> {
    const recommendations = await this.prisma.recommendationHistory.findMany({
      where: { type },
      orderBy: { createdAt: 'desc' },
    });

    return recommendations.map(this.toDomain);
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<{
    data: RecommendationHistory[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [recommendations, total] = await Promise.all([
      this.prisma.recommendationHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.recommendationHistory.count({
        where: { userId },
      }),
    ]);

    return {
      data: recommendations.map(this.toDomain),
      total,
    };
  }

  async findByOrderId(orderId: string): Promise<RecommendationHistory | null> {
    const recommendation = await this.prisma.recommendationHistory.findFirst({
      where: { orderId },
    });

    return recommendation ? this.toDomain(recommendation) : null;
  }

  async findRecent(limit: number): Promise<RecommendationHistory[]> {
    const recommendations = await this.prisma.recommendationHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return recommendations.map(this.toDomain);
  }

  async findAll(page: number, limit: number): Promise<{
    data: RecommendationHistory[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [recommendations, total] = await Promise.all([
      this.prisma.recommendationHistory.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.recommendationHistory.count(),
    ]);

    return {
      data: recommendations.map(this.toDomain),
      total,
    };
  }

  async update(recommendation: RecommendationHistory): Promise<RecommendationHistory> {
    const updated = await this.prisma.recommendationHistory.update({
      where: { id: recommendation.id },
      data: {
        round: recommendation.round,
        numbers: recommendation.numbers,
        type: recommendation.type,
        conditions: recommendation.conditions ? JSON.parse(JSON.stringify(recommendation.conditions)) : undefined,
        imageData: recommendation.imageData ? JSON.parse(JSON.stringify(recommendation.imageData)) : undefined,
        gptModel: recommendation.gptModel,
        analysis: recommendation.analysis,
        updatedAt: new Date(),
      },
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recommendationHistory.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.recommendationHistory.count({
      where: { id },
    });
    return count > 0;
  }

  async findAllWithFilters(
    page: number, 
    limit: number, 
    type?: RecommendationType,
    winStatus?: WinStatus
  ): Promise<{
    data: RecommendationHistory[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    // type 필터 조건
    const whereCondition: any = {};
    if (type) {
      whereCondition.type = type;
    }

    const [recommendations, total] = await Promise.all([
      this.prisma.recommendationHistory.findMany({
        where: whereCondition,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.recommendationHistory.count({
        where: whereCondition,
      }),
    ]);

    return {
      data: recommendations.map(this.toDomain),
      total,
    };
  }

  private toDomain(prismaModel: any): RecommendationHistory {
    return new RecommendationHistory(
      prismaModel.id,
      prismaModel.userId,
      prismaModel.round,
      prismaModel.numbers,
      prismaModel.type,
      prismaModel.conditions,
      prismaModel.imageData,
      prismaModel.gptModel,
      prismaModel.analysis,
      prismaModel.orderId,
      prismaModel.createdAt,
      prismaModel.updatedAt,
    );
  }
} 