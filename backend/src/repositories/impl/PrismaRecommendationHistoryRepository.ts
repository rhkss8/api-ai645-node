import { PrismaClient } from '@prisma/client';
import { RecommendationHistory } from '../../entities/RecommendationHistory';
import { IRecommendationHistoryRepository } from '../IRecommendationHistoryRepository';
import { RecommendationType } from '../../types/common';

export class PrismaRecommendationHistoryRepository implements IRecommendationHistoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(recommendation: RecommendationHistory): Promise<RecommendationHistory> {
    const created = await this.prisma.recommendationHistory.create({
      data: {
        id: recommendation.id,
        round: recommendation.round,
        numbers: recommendation.numbers,
        type: recommendation.type,
        conditions: recommendation.conditions ? JSON.parse(JSON.stringify(recommendation.conditions)) : undefined,
        imageData: recommendation.imageData ? JSON.parse(JSON.stringify(recommendation.imageData)) : undefined,
        gptModel: recommendation.gptModel,
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

  private toDomain(prismaModel: any): RecommendationHistory {
    return new RecommendationHistory(
      prismaModel.id,
      prismaModel.round,
      prismaModel.numbers,
      prismaModel.type,
      prismaModel.conditions,
      prismaModel.imageData,
      prismaModel.gptModel,
      prismaModel.createdAt,
      prismaModel.updatedAt,
    );
  }
} 